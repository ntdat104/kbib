import { JWT } from "google-auth-library";
import { columnsOf, schema, type TableName } from "./schema";
import type { Driver, RawRow } from "./driver";

const API = "https://sheets.googleapis.com/v4/spreadsheets";

function colLetter(n: number) {
  let s = "";
  for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Google Sheets driver.
 * - One tab per table, header in row 1; rows are never deleted so row numbers are stable.
 * - Optional sharding: GOOGLE_SHEET_ID_<TABLE> points a table to its own spreadsheet.
 * - Values are written with valueInputOption=RAW so user input is never evaluated as a formula.
 */
export class SheetsDriver implements Driver {
  readonly name = "sheets" as const;
  private jwt: JWT;
  private headers = new Map<TableName, string[]>();
  private rowIndex = new Map<TableName, Map<string, number>>();

  constructor() {
    this.jwt = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }

  private sheetId(table: TableName) {
    return process.env[`GOOGLE_SHEET_ID_${table.toUpperCase()}`] || process.env.GOOGLE_SHEET_ID!;
  }

  private async call<R>(url: string, method = "GET", data?: unknown): Promise<R> {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await this.jwt.request<R>({ url, method: method as "GET", data });
        return res.data;
      } catch (err) {
        const status = (err as { status?: number; response?: { status?: number } }).response?.status;
        const retryable = status === 429 || (status !== undefined && status >= 500);
        if (!retryable || attempt >= 5) throw err;
        await sleep(Math.min(16000, 500 * 2 ** attempt) + Math.random() * 300);
      }
    }
  }

  private range(table: TableName, a1 = "") {
    return encodeURIComponent(a1 ? `${table}!${a1}` : table);
  }

  async ensureSchema() {
    const tables = Object.keys(schema) as TableName[];
    const bySheet = new Map<string, TableName[]>();
    for (const t of tables) bySheet.set(this.sheetId(t), [...(bySheet.get(this.sheetId(t)) ?? []), t]);

    for (const [sid, group] of bySheet) {
      const meta = await this.call<{ sheets: { properties: { title: string } }[] }>(
        `${API}/${sid}?fields=sheets.properties.title`,
      );
      const existing = new Set(meta.sheets.map((s) => s.properties.title));
      const missing = group.filter((t) => !existing.has(t));
      if (missing.length) {
        await this.call(`${API}/${sid}:batchUpdate`, "POST", {
          requests: missing.map((title) => ({
            addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } },
          })),
        });
      }
      const qs = group.map((t) => `ranges=${this.range(t, "1:1")}`).join("&");
      const got = await this.call<{ valueRanges: { values?: string[][] }[] }>(
        `${API}/${sid}/values:batchGet?${qs}`,
      );
      const data: { range: string; values: string[][] }[] = [];
      group.forEach((t, i) => {
        const header = got.valueRanges[i]?.values?.[0] ?? [];
        const wanted = columnsOf(t);
        const merged = [...header, ...wanted.filter((c) => !header.includes(c))];
        this.headers.set(t, merged);
        if (merged.length !== header.length) {
          data.push({ range: `${t}!A1:${colLetter(merged.length)}1`, values: [merged] });
        }
      });
      if (data.length) {
        await this.call(`${API}/${sid}/values:batchUpdate`, "POST", { valueInputOption: "RAW", data });
      }
    }
  }

  private async header(table: TableName) {
    if (!this.headers.has(table)) await this.ensureSchema();
    return this.headers.get(table)!;
  }

  async readAll(table: TableName): Promise<RawRow[]> {
    const header = await this.header(table);
    const res = await this.call<{ values?: string[][] }>(
      `${API}/${this.sheetId(table)}/values/${this.range(table)}?majorDimension=ROWS`,
    );
    const values = res.values ?? [];
    const liveHeader = values[0]?.length ? values[0] : header;
    const index = new Map<string, number>();
    const rows: RawRow[] = [];
    for (let i = 1; i < values.length; i++) {
      const r: RawRow = {};
      liveHeader.forEach((h, c) => (r[h] = values[i][c] ?? ""));
      if (!r.id) continue;
      index.set(r.id, i + 1); // 1-based sheet row
      rows.push(r);
    }
    this.headers.set(table, liveHeader);
    this.rowIndex.set(table, index);
    return rows;
  }

  private toValues(header: string[], row: RawRow) {
    return header.map((h) => row[h] ?? "");
  }

  async append(table: TableName, rows: RawRow[]) {
    if (!rows.length) return;
    const header = await this.header(table);
    const res = await this.call<{ updates?: { updatedRange?: string } }>(
      `${API}/${this.sheetId(table)}/values/${this.range(table, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      "POST",
      { values: rows.map((r) => this.toValues(header, r)) },
    );
    // Track row numbers of the appended block so later updates don't need a re-read.
    const m = res.updates?.updatedRange?.match(/![A-Z]+(\d+)/);
    const index = this.rowIndex.get(table);
    if (m && index) rows.forEach((r, i) => index.set(r.id, Number(m[1]) + i));
  }

  async update(table: TableName, id: string, row: RawRow) {
    let rowNo = this.rowIndex.get(table)?.get(id);
    if (!rowNo) {
      await this.readAll(table);
      rowNo = this.rowIndex.get(table)?.get(id);
    }
    if (!rowNo) throw new Error(`Row ${table}/${id} not found`);
    const header = await this.header(table);
    await this.call(
      `${API}/${this.sheetId(table)}/values/${this.range(table, `A${rowNo}:${colLetter(header.length)}${rowNo}`)}?valueInputOption=RAW`,
      "PUT",
      { values: [this.toValues(header, row)] },
    );
  }

  async replaceAll(table: TableName, rows: RawRow[]) {
    const header = columnsOf(table);
    const sid = this.sheetId(table);
    await this.call(`${API}/${sid}/values/${this.range(table)}:clear`, "POST", {});
    await this.call(
      `${API}/${sid}/values/${this.range(table, "A1")}?valueInputOption=RAW`,
      "PUT",
      { values: [header, ...rows.map((r) => this.toValues(header, r))] },
    );
    this.headers.set(table, header);
    this.rowIndex.set(table, new Map(rows.map((r, i) => [r.id, i + 2])));
  }
}
