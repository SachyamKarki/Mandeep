// The three lookup tables share one shape: an id, a name and one more text column.
// SQL for them is built only from this fixed config, never from user input.

export type DirectoryKind = "insurer" | "client" | "surveyor";

export type DirectoryConfig = {
  kind: DirectoryKind;
  table: DirectoryKind;
  pk: string;
  label: string;
  plural: string;
  fields: { name: string; label: string; max: number; placeholder?: string }[];
};

export const DIRECTORY: Record<DirectoryKind, DirectoryConfig> = {
  insurer: {
    kind: "insurer",
    table: "insurer",
    pk: "insurer_id",
    label: "Insurer",
    plural: "Insurers",
    fields: [
      { name: "insurer_name", label: "Insurer name", max: 120, placeholder: "e.g. Sagar General Insurance" },
      { name: "phone", label: "Phone", max: 20, placeholder: "01-4xxxxxx" },
    ],
  },
  client: {
    kind: "client",
    table: "client",
    pk: "client_id",
    label: "Client",
    plural: "Clients",
    fields: [
      { name: "client_name", label: "Client name", max: 120 },
      { name: "phone", label: "Phone", max: 20, placeholder: "98xxxxxxxx" },
    ],
  },
  surveyor: {
    kind: "surveyor",
    table: "surveyor",
    pk: "surveyor_id",
    label: "Surveyor",
    plural: "Surveyors",
    fields: [
      { name: "surveyor_name", label: "Surveyor name", max: 120 },
      { name: "licence_no", label: "Licence number", max: 30, placeholder: "NIA-SV-0000" },
    ],
  },
};

export function isDirectoryKind(value: string): value is DirectoryKind {
  return value in DIRECTORY;
}
