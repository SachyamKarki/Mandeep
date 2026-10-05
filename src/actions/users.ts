"use server";

// User management (administrator only). Everyone added here is staff.

import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { email, fail, field, FormError, newPassword, requireAdminForm } from "@/actions/shared";
import type { FormState } from "@/lib/form-state";

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const admin = await requireAdminForm();
    const name = field(fd, "full_name", "Full name", 100);
    const mail = email(fd);
    const hash = await hashPassword(newPassword(fd));
    // There is one administrator (the first account); everyone added here is staff.
    await transaction(admin.full_name, (tx) =>
      tx.execute(`INSERT INTO app_user (full_name, email, password_hash, role) VALUES (?, ?, ?, 'staff')`, [
        name,
        mail,
        hash,
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
    // The administrator account can never be switched off; the checkbox is only sent for staff.
    const active = userId === admin.user_id || fd.get("is_active") === "on";

    await transaction(admin.full_name, async (tx) => {
      // Roles never change here: one admin, everyone else staff.
      const result = await tx.execute(
        `UPDATE app_user SET full_name = ?, email = ?, is_active = IF(role = 'admin', TRUE, ?) WHERE user_id = ?`,
        [name, mail, active ? 1 : 0, userId],
      );
      if (result.affectedRows === 0) throw new FormError("That user no longer exists.");
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
