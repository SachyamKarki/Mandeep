import { LICENCE_HINT, LICENCE_PATTERN, NAME_MIN, NAME_PATTERN, PHONE_HINT, PHONE_PATTERN } from "@/lib/validation";

// The three lookup tables share one shape: an id, a name and one more text column.
// SQL for them is built only from this fixed config, never from user input.

export type DirectoryKind = "insurer" | "client" | "surveyor";

export type DirectoryConfig = {
  kind: DirectoryKind;
  table: DirectoryKind;
  pk: string;
  label: string;
  plural: string;
  fields: DirectoryField[];
};

export type DirectoryField = {
  name: string;
  label: string;
  max: number;
  placeholder?: string;
  /** Regex the value must match (also used as the input's HTML pattern). */
  pattern: string;
  /** Shown under the input and as the error message when the pattern fails. */
  hint?: string;
  min?: number;
};

const nameField = (name: string, label: string, placeholder?: string): DirectoryField => ({
  name,
  label,
  max: 120,
  min: NAME_MIN,
  pattern: NAME_PATTERN,
  placeholder,
});

const phoneField: DirectoryField = { name: "phone", label: "Phone", max: 20, pattern: PHONE_PATTERN, hint: PHONE_HINT };

export const DIRECTORY: Record<DirectoryKind, DirectoryConfig> = {
  insurer: {
    kind: "insurer",
    table: "insurer",
    pk: "insurer_id",
    label: "Insurer",
    plural: "Insurers",
    fields: [
      nameField("insurer_name", "Insurer name", "e.g. Sagar General Insurance"),
      { ...phoneField, placeholder: "01-4412345" },
    ],
  },
  client: {
    kind: "client",
    table: "client",
    pk: "client_id",
    label: "Client",
    plural: "Clients",
    fields: [
      nameField("client_name", "Client name", "e.g. Himal Cement Udyog"),
      { ...phoneField, placeholder: "9801234567" },
    ],
  },
  surveyor: {
    kind: "surveyor",
    table: "surveyor",
    pk: "surveyor_id",
    label: "Surveyor",
    plural: "Surveyors",
    fields: [
      nameField("surveyor_name", "Surveyor name", "e.g. Kamala Bhattarai"),
      {
        name: "licence_no",
        label: "Licence number",
        max: 30,
        pattern: LICENCE_PATTERN,
        hint: LICENCE_HINT,
        placeholder: "NIA-SV-0000",
      },
    ],
  },
};

export function isDirectoryKind(value: string): value is DirectoryKind {
  return value in DIRECTORY;
}
