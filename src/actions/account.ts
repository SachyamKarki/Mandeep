"use server";

// My account: change your own password and sign out other devices.

import { revalidatePath } from "next/cache";
import { currentTokenHash, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { fail, FormError, newPassword } from "@/actions/shared";
import type { FormState } from "@/lib/form-state";

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
