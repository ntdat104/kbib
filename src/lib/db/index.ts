import { decodeCell, encodeCell, schema, type Kind, type RowTypes, type TableName } from "./schema";
import { sheetsConfigured, type Driver, type RawRow } from "./driver";
import { LocalDriver } from "./local-driver";
import { SheetsDriver } from "./sheets-driver";

type CacheEntry = { rows: unknown[]; at: number; loading?: Promise<unknown[]> };

interface DbState {
  driver: Driver;
  cache: Map<TableName, CacheEntry>;
  locks: Map<string, Promise<unknown>>;
  ready?: Promise<void>;
}

// Survive dev-mode module reloads: keep one driver/cache per process.
const g = globalThis as unknown as { __kbibDb?: DbState };
function state(): DbState {
  if (!g.__kbibDb) {
    g.__kbibDb = {
      driver: sheetsConfigured() ? new SheetsDriver() : new LocalDriver(),
      cache: new Map(),
      locks: new Map(),
    };
  }
  return g.__kbibDb;
}

const TTL = () => (state().driver.name === "local" ? Infinity : Number(process.env.SHEETS_CACHE_TTL_MS ?? 15000));

async function ready() {
  const s = state();
  s.ready ??= (async () => {
    await s.driver.ensureSchema();
    if (s.driver.name === "local") {
      const users = await s.driver.readAll("users");
      if (!users.length) {
        const { seedAll } = await import("./seed");
        await seedAll();
      }
    }
  })().catch((e) => {
    s.ready = undefined;
    throw e;
  });
  return s.ready;
}

function decode<T>(table: TableName, raw: RawRow): T {
  const cols = schema[table] as Record<string, Kind>;
  const out: Record<string, unknown> = {};
  for (const [k, kind] of Object.entries(cols)) out[k] = decodeCell(kind, raw[k]);
  return out as T;
}

function encode(table: TableName, row: object): RawRow {
  const cols = schema[table] as Record<string, Kind>;
  const out: RawRow = {};
  for (const [k, kind] of Object.entries(cols)) out[k] = encodeCell(kind, (row as Record<string, unknown>)[k]);
  return out;
}

function defaults(table: TableName): Record<string, unknown> {
  const cols = schema[table] as Record<string, Kind>;
  return Object.fromEntries(
    Object.entries(cols).map(([k, kind]) => [k, kind === "number" ? 0 : kind === "boolean" ? false : kind === "json" ? null : ""]),
  );
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Generic repository over one table with read-through cache and write-through updates. */
export class Repo<N extends TableName> {
  constructor(private table: N) {}

  async all(): Promise<RowTypes[N][]> {
    await ready();
    const s = state();
    const entry = s.cache.get(this.table);
    // Check in-flight load first: the placeholder entry must never be served as fresh data.
    if (entry?.loading) return (await entry.loading) as RowTypes[N][];
    if (entry && Date.now() - entry.at < TTL()) return entry.rows as RowTypes[N][];
    const loading = s.driver
      .readAll(this.table)
      .then((raws) => raws.map((r) => decode<RowTypes[N]>(this.table, r)));
    s.cache.set(this.table, { rows: entry?.rows ?? [], at: entry?.at ?? 0, loading });
    try {
      const rows = await loading;
      s.cache.set(this.table, { rows, at: Date.now() });
      return rows;
    } catch (e) {
      s.cache.delete(this.table);
      throw e;
    }
  }

  async where(pred: (r: RowTypes[N]) => boolean) {
    return (await this.all()).filter(pred);
  }

  async find(pred: (r: RowTypes[N]) => boolean) {
    return (await this.all()).find(pred) ?? null;
  }

  async get(id: string) {
    if (!id) return null;
    return this.find((r) => (r as { id: string }).id === id);
  }

  async insert(data: Partial<RowTypes[N]>): Promise<RowTypes[N]> {
    return (await this.insertMany([data]))[0];
  }

  async insertMany(items: Partial<RowTypes[N]>[]): Promise<RowTypes[N][]> {
    const rows = items.map((d) => ({ ...defaults(this.table), ...d }) as unknown as RowTypes[N]);
    const cached = await this.all();
    await state().driver.append(this.table, rows.map((r) => encode(this.table, r as object)));
    cached.push(...rows);
    return rows;
  }

  async update(id: string, patch: Partial<RowTypes[N]>): Promise<RowTypes[N]> {
    const rows = await this.all();
    const i = rows.findIndex((r) => (r as { id: string }).id === id);
    if (i < 0) throw new Error(`${this.table}/${id} not found`);
    const next = { ...rows[i], ...patch };
    await state().driver.update(this.table, id, encode(this.table, next as object));
    rows[i] = next;
    return next;
  }

  /** Bulk replace — used by seed only. */
  async replaceAll(items: Partial<RowTypes[N]>[]) {
    const rows = items.map((d) => ({ ...defaults(this.table), ...d }) as unknown as RowTypes[N]);
    await state().driver.replaceAll(this.table, rows.map((r) => encode(this.table, r as object)));
    state().cache.set(this.table, { rows, at: Date.now() });
  }
}

type Db = { [N in TableName]: Repo<N> };
export const db = Object.fromEntries(
  (Object.keys(schema) as TableName[]).map((t) => [t, new Repo(t)]),
) as Db;

export const driverName = () => state().driver.name;

export async function ensureSchema() {
  await state().driver.ensureSchema();
}

export function invalidateCache() {
  state().cache.clear();
}

/**
 * In-process mutex. Google Sheets has no transactions, so critical sections
 * (reserving a listing, paying out) are serialized per key. For multi-instance
 * deployments replace with a Redis lock.
 */
export async function withLock<R>(key: string, fn: () => Promise<R>): Promise<R> {
  const locks = state().locks;
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((r) => (release = r));
  const chained = prev.then(() => current);
  locks.set(key, chained);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === chained) locks.delete(key);
  }
}
