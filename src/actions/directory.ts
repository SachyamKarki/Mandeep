"use server";

// Directory: add, edit and delete insurers, clients and surveyors.
// Every action checks the signed-in user, validates the form on the server,
// writes in a transaction (so the audit triggers know who made the change)
// and returns a message for the toast.

import { redirect } from "next/navigation";
import { transaction } from "@/lib/db";
import { DIRECTORY, isDirectoryKind } from "@/lib/directory";
import { flash } from "@/lib/flash";
import { assertFound, directoryValue, FormError, getActor, getAdminActor, id, refresh, toFormState } from "@/actions/shared";
import type { FormState } from "@/lib/form-state";

function directoryConfig(fd: FormData) {
  const kind = String(fd.get("kind") ?? "");
  if (!isDirectoryKind(kind)) throw new FormError("Unknown record type.");
  return DIRECTORY[kind];
}

export async function addDirectoryEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const cfg = directoryConfig(fd);
    const values = cfg.fields.map((f) => directoryValue(fd, f));
    await transaction(await getActor(), (tx) =>
      tx.execute(
        `INSERT INTO ${cfg.table} (${cfg.fields.map((f) => f.name).join(", ")}) VALUES (${cfg.fields.map(() => "?").join(", ")})`,
        values,
      ),
    );
    refresh();
    return { success: `${cfg.label} added.` };
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateDirectoryEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const cfg = directoryConfig(fd);
    const values = cfg.fields.map((f) => directoryValue(fd, f));
    const recordId = id(fd, "id", cfg.label.toLowerCase());
    await transaction(await getActor(), async (tx) => {
      const result = await tx.execute(
        `UPDATE ${cfg.table} SET ${cfg.fields.map((f) => `${f.name} = ?`).join(", ")} WHERE ${cfg.pk} = ?`,
        [...values, recordId],
      );
      assertFound(result.affectedRows, cfg.label.toLowerCase());
    });
    refresh();
    return { success: `${cfg.label} updated.` };
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteDirectoryEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  let kind: string;
  try {
    const cfg = directoryConfig(fd);
    kind = cfg.kind;
    const recordId = id(fd, "id", cfg.label.toLowerCase());
    // ON DELETE RESTRICT on claim stops this if any claim still points here.
    await transaction(await getAdminActor(), async (tx) => {
      const result = await tx.execute(`DELETE FROM ${cfg.table} WHERE ${cfg.pk} = ?`, [recordId]);
      assertFound(result.affectedRows, cfg.label.toLowerCase());
    });
  } catch (err) {
    return toFormState(err);
  }
  refresh();
  await flash(`${DIRECTORY[kind as keyof typeof DIRECTORY].label} deleted.`);
  redirect(`/directory?tab=${kind}`);
}
