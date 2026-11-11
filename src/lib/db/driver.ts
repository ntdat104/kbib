import type { TableName } from "./schema";

/** A raw row as stored in the sheet: header name → cell string. */
export type RawRow = Record<string, string>;

export interface Driver {
  readonly name: "sheets" | "local";
  ensureSchema(): Promise<void>;
  readAll(table: TableName): Promise<RawRow[]>;
  append(table: TableName, rows: RawRow[]): Promise<void>;
  update(table: TableName, id: string, row: RawRow): Promise<void>;
  replaceAll(table: TableName, rows: RawRow[]): Promise<void>;
}

export function sheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}
