"use server";

// Signing in and out, and creating the administrator on a new install.

import { redirect } from "next/navigation";
import { burnPasswordCheck, endSession, hashPassword, LOCK_MINUTES, MAX_FAILED_LOGINS, safeNext, startSession, userCount, verifyPassword } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { flash } from "@/lib/flash";
import { email, fail, field, FormError, newPassword } from "@/actions/shared";
import type { FormState } from "@/lib/form-state";

// ---------- first-run setup ----------

export async function setupFirstAdmin(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const name = field(fd, "full_name", "Full name", 100);
    const mail = email(fd);
    const hash = await hashPassword(newPassword(fd));
    const userId = await transaction(name, async (tx) => {
      // Locks the table range so two setup forms cannot both create an admin.
      const [{ n }] = await tx.select<{ n: number }>(`SELECT COUNT(*) AS n FROM app_user FOR UPDATE`);
      if (n > 0) throw new FormError("An account already exists. Sign in instead.");
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
  await flash("Welcome. Your administrator account is ready.");
  redirect("/");
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

    if ((await userCount()) === 0) redirect("/register");

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
  await flash("Signed in.");
  redirect(next);
}

export async function logout() {
  await endSession();
  await flash("You have been signed out.");
  redirect("/login");
}
