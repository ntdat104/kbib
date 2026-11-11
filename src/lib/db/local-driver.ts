import { promises as fs } from "node:fs";
import path from "node:path";
import type { TableName } from "./schema";
import type { Driver, RawRow } from "./driver";

/** JSON-file driver for local development / demo when Google Sheets is not configured. */
export class LocalDriver implements Driver {
  readonly name = "local" as const;
  private file = path.join(process.cwd(), ".data", "db.json");
  private data: Partial<Record<TableName, RawRow[]>> | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  private async load() {
    if (this.data) return this.data;
    try {
      this.data = JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch {
      this.data = {};
    }
    return this.data!;
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(async () => {
      this.flushTimer = null;
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.data));
      await fs.rename(tmp, this.file);
    }, 150);
  }

  async ensureSchema() {
    await this.load();
  }

  async readAll(table: TableName) {
    const d = await this.load();
    return (d[table] ?? []).map((r) => ({ ...r }));
  }

  async append(table: TableName, rows: RawRow[]) {
    const d = await this.load();
    d[table] = [...(d[table] ?? []), ...rows];
    this.scheduleFlush();
  }

  async update(table: TableName, id: string, row: RawRow) {
    const d = await this.load();
    const list = d[table] ?? [];
    const i = list.findIndex((r) => r.id === id);
    if (i < 0) throw new Error(`Row ${table}/${id} not found`);
    list[i] = row;
    this.scheduleFlush();
  }

  async replaceAll(table: TableName, rows: RawRow[]) {
    const d = await this.load();
    d[table] = rows;
    this.scheduleFlush();
  }
}
