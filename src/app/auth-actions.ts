"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  LOCK_MINUTES,
  MAX_FAILED_LOGINS,
  burnPasswordCheck,
  currentTokenHash,
  endSession,
  hashPassword,
  passwordProblem,
  requireUser,
  safeNext,
  startSession,
  userCount,
  verifyPassword,
  type Role,
} from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import type { FormState } from "./actions";

class FormError extends Error {}

const ROLES: Role[] = ["admin", "staff"];

function field(fd: FormData, name: string, label: string, max = 120): string {
  const value = String(fd.get(name) ?? "").trim();
  if (!value) throw new FormError(`${label} is required.`);
  if (value.length > max) throw new FormError(`${label} is too long.`);
  return value;
}

function email(fd: FormData): string {
  const value = field(fd, "email", "Email", 190).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new FormError("Enter a valid email address.");
  return value;
}

function newPassword(fd: FormData, name = "password", confirmName = "confirm"): string {
  const password = String(fd.get(name) ?? "");
  const problem = passwordProblem(password);
  if (problem) throw new FormError(problem);
  if (fd.has(confirmName) && fd.get(confirmName) !== password) throw new FormError("The two passwords do not match.");
  return password;
}

function fail(err: unknown): FormState {
  unstable_rethrow(err); // let redirect() and notFound() through
  if (err instanceof FormError) return { error: err.message };
  if ((err as { code?: string }).code === "ER_DUP_ENTRY") return { error: "An account with that email already exists." };
  console.error(err);
  return { error: "Something went wrong. Please try again." };
}

async function requireAdminForm() {
  const user = await requireUser();
  if (user.role !== "admin") throw new FormError("Only an administrator can do that.");
  return user;
}

// ---------- first-run setup ----------

export async function setupFirstAdmin(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const name = field(fd, "full_name", "Full name", 100);
    const mail = email(fd);
    const hash = await hashPassword(newPassword(fd));
    const userId = await transaction(name, async (tx) => {
      // Locks the table range so two setup forms cannot both create an admin.
      const [{ n }] = await tx.select<{ n: number }>(`SELECT COUNT(*) AS n FROM app_user FOR UPDATE`);
      if (n > 0) throw new FormError("Setup is already done. Sign in instead.");
      const result = await tx.execute(
        `INSERT INTO app_user (full_name, email, password_hash, role, last_login_at) VALUES (?, ?, ?, 'admin', NOW())`,
        [name, mail, hash],
      );
      return result.insertId;
    });
    await startSession(userId, true);
  } catch (err) {
    return fail(err);
  }
  redirect("/");
}

// ---------- self-registration ----------

/** Creates a staff account that cannot sign in until an admin approves it. */
export async function register(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    if ((await userCount()) === 0) redirect("/setup");
    const name = field(fd, "full_name", "Full name", 100);
    const mail = email(fd);
    const hash = await hashPassword(newPassword(fd));
    try {
      await transaction(name, (tx) =>
        tx.execute(
          `INSERT INTO app_user (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'staff', FALSE)`,
          [name, mail, hash],
        ),
      );
    } catch (err) {
      // Same reply when the email is taken, so this form cannot be used to find out who has an account.
      if ((err as { code?: string }).code !== "ER_DUP_ENTRY") throw err;
    }
    return { success: "Request sent. You can sign in once an administrator approves your account." };
  } catch (err) {
    return fail(err);
  }
}

// ---------- sign in / out ----------

type LoginRow = {
  user_id: number;
  full_name: string;
  password_hash: string;
  is_active: number;
  failed_logins: number;
  locked: number;
  last_login_at: string | null;
};

const BAD_LOGIN = "That email and password do not match an account.";

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const next = safeNext(fd.get("next"));
  try {
    const mail = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    if (!mail || !password) throw new FormError("Enter your email and password.");

    if ((await userCount()) === 0) redirect("/setup");

    const [user] = await query<LoginRow>(
      `SELECT user_id, full_name, password_hash, is_active, failed_logins, last_login_at,
              COALESCE(locked_until > NOW(), 0) AS locked
       FROM app_user WHERE email = ?`,
      [mail],
    );
    if (!user) {
      await burnPasswordCheck(password);
      throw new FormError(BAD_LOGIN);
    }
    if (user.locked) throw new FormError(`Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`);

    if (!(await verifyPassword(password, user.password_hash))) {
      const attempts = user.failed_logins + 1;
      const lock = attempts >= MAX_FAILED_LOGINS;
      await transaction(user.full_name, (tx) =>
        tx.execute(
          `UPDATE app_user
           SET failed_logins = ?, locked_until = IF(?, DATE_ADD(NOW(), INTERVAL ? MINUTE), NULL)
           WHERE user_id = ?`,
          [lock ? 0 : attempts, lock ? 1 : 0, LOCK_MINUTES, user.user_id],
        ),
      );
      if (lock) throw new FormError(`Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`);
      // Same message as an unknown email, so the form does not reveal which emails have accounts.
      throw new FormError(BAD_LOGIN);
    }

    if (!user.is_active) {
      // Never signed in + inactive = a registration still waiting for approval.
      throw new FormError(
        user.last_login_at
          ? "This account is switched off. Ask an administrator."
          : "Your account is waiting for an administrator to approve it.",
      );
    }

    await transaction(user.full_name, (tx) =>
      tx.execute(
        `UPDATE app_user SET failed_logins = 0, locked_until = NULL, last_login_at = NOW() WHERE user_id = ?`,
        [user.user_id],
      ),
    );
    await startSession(user.user_id, fd.get("remember") === "on");
  } catch (err) {
    return fail(err);
  }
  redirect(next);
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ---------- my account ----------

export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const me = await requireUser();
    const [row] = await query<{ password_hash: string }>(`SELECT password_hash FROM app_user WHERE user_id = ?`, [
      me.user_id,
    ]);
    if (!(await verifyPassword(String(fd.get("current") ?? ""), row.password_hash))) {
      throw new FormError("Your current password is not right.");
    }
    const hash = await hashPassword(newPassword(fd));
    const keep = await currentTokenHash();
    await transaction(me.full_name, async (tx) => {
      await tx.execute(`UPDATE app_user SET password_hash = ?, password_changed_at = NOW() WHERE user_id = ?`, [
        hash,
        me.user_id,
      ]);
      // Sign out every other browser that used the old password.
      await tx.execute(`DELETE FROM user_session WHERE user_id = ? AND token_hash <> ?`, [me.user_id, keep]);
    });
    return { success: "Password changed. Other devices have been signed out." };
  } catch (err) {
    return fail(err);
  }
}

export async function signOutOtherDevices(): Promise<FormState> {
  try {
    const me = await requireUser();
    const keep = await currentTokenHash();
    const result = await transaction(me.full_name, (tx) =>
      tx.execute(`DELETE FROM user_session WHERE user_id = ? AND token_hash <> ?`, [me.user_id, keep]),
    );
    revalidatePath("/account");
    return { success: `Signed out ${result.affectedRows} other ${result.affectedRows === 1 ? "session" : "sessions"}.` };
  } catch (err) {
    return fail(err);
  }
}

// ---------- user management (admins only) ----------

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminForm();
    const name = field(fd, "full_name", "Full name", 100);
    const mail = email(fd);
    const role = String(fd.get("role")) as Role;
    if (!ROLES.includes(role)) throw new FormError("Choose a role.");
    const hash = await hashPassword(newPassword(fd));
    await transaction(admin.full_name, (tx) =>
      tx.execute(`INSERT INTO app_user (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`, [
        name,
        mail,
        hash,
        role,
      ]),
    );
    revalidatePath("/users");
    return { success: `${name} can now sign in.` };
  } catch (err) {
    return fail(err);
  }
}

export async function updateUser(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminForm();
    const userId = Number(fd.get("user_id"));
    const name = field(fd, "full_name", "Full name", 100);
    const mail = email(fd);
    const role = String(fd.get("role")) as Role;
    if (!ROLES.includes(role)) throw new FormError("Choose a role.");
    const active = fd.get("is_active") === "on";

    if (userId === admin.user_id && (role !== "admin" || !active)) {
      throw new FormError("You cannot remove your own admin access or switch off your own account.");
    }

    await transaction(admin.full_name, async (tx) => {
      const result = await tx.execute(
        `UPDATE app_user SET full_name = ?, email = ?, role = ?, is_active = ? WHERE user_id = ?`,
        [name, mail, role, active ? 1 : 0, userId],
      );
      if (result.affectedRows === 0) throw new FormError("That user no longer exists.");
      const [{ admins }] = await tx.select<{ admins: number }>(
        `SELECT COUNT(*) AS admins FROM app_user WHERE role = 'admin' AND is_active = TRUE`,
      );
      if (admins === 0) throw new FormError("At least one active administrator is needed.");
      if (!active) await tx.execute(`DELETE FROM user_session WHERE user_id = ?`, [userId]);
    });
    revalidatePath("/", "layout");
    return { success: "User updated." };
  } catch (err) {
    return fail(err);
  }
}

export async function resetUserPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminForm();
    const userId = Number(fd.get("user_id"));
    const hash = await hashPassword(newPassword(fd));
    await transaction(admin.full_name, async (tx) => {
      const result = await tx.execute(
        `UPDATE app_user
         SET password_hash = ?, password_changed_at = NOW(), failed_logins = 0, locked_until = NULL
         WHERE user_id = ?`,
        [hash, userId],
      );
      if (result.affectedRows === 0) throw new FormError("That user no longer exists.");
      await tx.execute(`DELETE FROM user_session WHERE user_id = ?`, [userId]);
    });
    revalidatePath("/users");
    return { success: "Password reset. Their old sessions were signed out." };
  } catch (err) {
    return fail(err);
  }
}

export async function approveUser(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminForm();
    const userId = Number(fd.get("user_id"));
    const result = await transaction(admin.full_name, (tx) =>
      tx.execute(`UPDATE app_user SET is_active = TRUE WHERE user_id = ? AND is_active = FALSE`, [userId]),
    );
    if (result.affectedRows === 0) throw new FormError("That request no longer exists.");
    revalidatePath("/", "layout");
    return { success: "Approved. They can sign in now." };
  } catch (err) {
    return fail(err);
  }
}

/** Removes a registration that was never approved (never signed in). */
export async function declineUser(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminForm();
    const userId = Number(fd.get("user_id"));
    const result = await transaction(admin.full_name, (tx) =>
      tx.execute(`DELETE FROM app_user WHERE user_id = ? AND is_active = FALSE AND last_login_at IS NULL`, [userId]),
    );
    if (result.affectedRows === 0) throw new FormError("That request no longer exists.");
    revalidatePath("/", "layout");
    return { success: "Request declined." };
  } catch (err) {
    return fail(err);
  }
}
