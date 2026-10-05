// Validation rules shared by the forms (HTML attributes) and the server actions,
// so the browser and the server always check the same thing.

/** Nepali phone: mobile 98XXXXXXXX / 97… / 96…, or landline 01-4412345 (area code, optional dash). */
export const PHONE_PATTERN = "(9[678][0-9]{8}|0[1-9][0-9]?-?[0-9]{6,7})";
export const PHONE_HINT = "Mobile 98XXXXXXXX or landline like 01-4412345";

/** Licence numbers such as NIA-SV-1042: letters, digits and dashes. */
export const LICENCE_PATTERN = "[A-Za-z0-9]+(-[A-Za-z0-9]+)*";
export const LICENCE_HINT = "Letters, numbers and dashes, e.g. NIA-SV-1042";

/** Names must have at least 2 characters and contain a letter. */
export const NAME_PATTERN = ".*[A-Za-z\\u0900-\\u097F].*";
export const NAME_MIN = 2;

// Column limits from 01_schema.sql: claimed_amount DECIMAL(12,2), fee_amount DECIMAL(10,2).
export const MAX_CLAIM = 9_999_999_999.99;
export const MAX_FEE = 99_999_999.99;

export const FINDINGS_MIN = 5;
export const FINDINGS_MAX = 2000;

/** The earliest visit date the office accepts. */
export const MIN_VISIT_DATE = "2000-01-01";

/** Today's date in local time as YYYY-MM-DD (toISOString would give the UTC date). */
export function localToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

export const matches = (pattern: string, value: string) => new RegExp(`^(?:${pattern})$`).test(value);
