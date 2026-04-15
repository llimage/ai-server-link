import * as lancedb from "@lancedb/lancedb";
import type { VectorQuery, VectorRecord, VectorSearchResult, VectorStore } from "./vector-store-types";

export interface LanceDbConfig {
  uri?: string;
  tableName?: string;
  vectorColumn?: string;
}

type LanceDbTable = any;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asVector(value: unknown): number[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  }
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as ArrayLike<number>)
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n));
  }
  if (typeof value === "object") {
    const record = value as { toArray?: () => unknown; [Symbol.iterator]?: () => Iterator<unknown> };
    if (typeof record.toArray === "function") {
      return asVector(record.toArray());
    }
    if (typeof record[Symbol.iterator] === "function") {
      return asVector(Array.from(record as Iterable<unknown>));
    }
  }
  return [];
}

function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  const record = asRecord(metadata);
  if (!record) return undefined;
  const cleaned: Record<string, unknown> = { ...record };
  delete cleaned.tenant_id;
  delete cleaned.tenantId;
  delete cleaned.tenantid;
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function resolveRowTenantId(row: Record<string, unknown>): string | undefined {
  const metadata = asRecord(row.metadata);
  return (
    asString(row.tenantId) ??
    asString(row.tenant_id) ??
    asString(row.tenantid) ??
    asString(metadata?.tenantId) ??
    asString(metadata?.tenant_id)
  );
}

function getRowVector(row: Record<string, unknown>, vectorColumn: string): number[] {
  const candidate = row[vectorColumn] ?? row.vector ?? row.embedding;
  return asVector(candidate);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return -1;
  return dot / denom;
}

function resolveScore(
  row: Record<string, unknown>,
  queryVector: number[],
  vectorColumn: string,
  rowVector?: number[],
): number {
  const vector = rowVector ?? getRowVector(row, vectorColumn);
  if (vector.length > 0 && vector.length === queryVector.length) {
    return cosineSimilarity(queryVector, vector);
  }
  if (typeof row._score === "number") return row._score;
  if (typeof row._distance === "number") return 1 / (1 + row._distance);
  return 0;
}

export class LanceDbVectorStore implements VectorStore {
  private readonly uri: string;
  private readonly tableName: string;
  private readonly vectorColumn: string;
  private db: any | null = null;

  constructor(config: LanceDbConfig = {}) {
    this.uri = config.uri ?? "./.lancedb";
    this.tableName = config.tableName ?? "vectors";
    this.vectorColumn = config.vectorColumn ?? "vector";
  }

  private async getDb(): Promise<any> {
    if (this.db) return this.db;
    this.db = await lancedb.connect(this.uri);
    return this.db;
  }

  private async tableExists(db: any): Promise<boolean> {
    const names = await db.tableNames();
    return Array.isArray(names) && names.includes(this.tableName);
  }

  private toRow(record: VectorRecord, options?: { includeNullMetadata?: boolean }): Record<string, unknown> {
    const row: Record<string, unknown> = {
      id: record.chunkId,
      chunkId: record.chunkId,
      documentId: record.documentId,
      sourceId: record.sourceId,
      tenantId: record.tenantId,
      text: record.text,
      [this.vectorColumn]: record.embedding,
    };
    const metadata = sanitizeMetadata(record.metadata);
    if (metadata !== undefined) {
      row.metadata = metadata;
    } else if (options?.includeNullMetadata) {
      row.metadata = null;
    }
    return row;
  }

  private async scanRows(table: LanceDbTable): Promise<Record<string, unknown>[]> {
    const selectColumns = [
      "id",
      "chunkId",
      "documentId",
      "sourceId",
      "tenantId",
      "text",
      this.vectorColumn,
    ];
    const rows = await table.query().select(selectColumns).toArray();
    return Array.isArray(rows) ? rows : [];
  }

  private async openOrCreateTable(
    rowsForCreate?: Record<string, unknown>[],
  ): Promise<{ table: LanceDbTable; created: boolean }> {
    const db = await this.getDb();
    const exists = await this.tableExists(db);
    if (exists) {
      const table = await db.openTable(this.tableName);
      return { table, created: false };
    }
    if (!rowsForCreate || rowsForCreate.length === 0) {
      throw new Error(`LanceDB table not found: ${this.tableName}`);
    }
    const table = await db.createTable(this.tableName, rowsForCreate);
    return { table, created: true };
  }

  private async getRowCount(table: LanceDbTable): Promise<number> {
    if (typeof table.countRows === "function") {
      try {
        const count = await table.countRows();
        return typeof count === "bigint" ? Number(count) : Number(count);
      } catch {
        // fall back to scan
      }
    }

    const rows = await this.scanRows(table);
    return rows.length;
  }

  private async getVectorDimension(table: LanceDbTable): Promise<number | null> {
    try {
      const rows = await table
        .query()
        .select([this.vectorColumn])
        .limit(1)
        .toArray();
      if (!Array.isArray(rows) || rows.length === 0) return null;
      const vector = getRowVector(rows[0], this.vectorColumn);
      return vector.length > 0 ? vector.length : null;
    } catch {
      return null;
    }
  }

  private rankRows(
    rows: Record<string, unknown>[],
    queryVector: number[],
    topK: number,
    tenantId?: string,
    fromSearch = false,
  ): VectorSearchResult[] {
    const scored = rows.map((row) => {
      const rowVector = getRowVector(row, this.vectorColumn);
      const score = fromSearch
        ? resolveScore(row, queryVector, this.vectorColumn, rowVector)
        : cosineSimilarity(queryVector, rowVector);
      return {
        row,
        score,
        hasVector: rowVector.length > 0,
      };
    });

    const valid = scored.filter((entry) => {
      if (fromSearch) return Number.isFinite(entry.score);
      return entry.hasVector && entry.score > -1;
    });

    const filtered = tenantId
      ? valid.filter((entry) => resolveRowTenantId(entry.row) === tenantId)
      : valid;

    const ranked = filtered.sort((a, b) => b.score - a.score).slice(0, topK);

    return ranked.map(({ row, score }) => ({
      chunkId: asString(row.chunkId) ?? "",
      documentId: asString(row.documentId) ?? "",
      sourceId: asString(row.sourceId) ?? "",
      tenantId: resolveRowTenantId(row) ?? "",
      text: asString(row.text) ?? "",
      score,
      metadata: asRecord(row.metadata),
    }));
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    if (!records?.length) return;

    const rows = records.map((record) => this.toRow(record));
    const { table, created } = await this.openOrCreateTable(rows);
    if (!created) {
      const schema = await table.schema();
      const hasMetadata =
        Array.isArray(schema?.fields) &&
        schema.fields.some((field: { name?: string }) => field?.name === "metadata");
      if (hasMetadata) {
        for (const row of rows) {
          if (!Object.prototype.hasOwnProperty.call(row, "metadata")) {
            row.metadata = null;
          }
        }
      }
      await table.add(rows);
    }
  }

  async query(query: VectorQuery): Promise<VectorSearchResult[]> {
    const { vector, topK, tenantId } = query;
    if (!Array.isArray(vector) || vector.length === 0) return [];

    const opened = await this.openOrCreateTable();
    const table = opened.table;
    const schema = await table.schema();
    const columnNames = Array.isArray(schema?.fields)
      ? schema.fields.map((field: { name?: string }) => field?.name).filter(Boolean)
      : [];
    if (!columnNames.includes(this.vectorColumn)) {
      throw new Error(`Vector column not found: ${this.vectorColumn}`);
    }
    const rowCount = await this.getRowCount(table);
    if (rowCount === 0) return [];

    const vectorDimension = await this.getVectorDimension(table);
    if (vectorDimension && vectorDimension !== vector.length) {
      throw new Error(
        `Query vector dimension ${vector.length} does not match table dimension ${vectorDimension}`,
      );
    }

    if (rowCount < 20) {
      const rows = await this.scanRows(table);
      return this.rankRows(rows, vector, topK, tenantId);
    }

    const overfetch = Math.max(topK * 20, 50);
    const vectorQuery = table.vectorSearch(vector);
    if (this.vectorColumn && this.vectorColumn !== "vector") {
      vectorQuery.column(this.vectorColumn);
    }
    vectorQuery.select(["chunkId", "documentId", "sourceId", "tenantId", "text", "_distance"]);
    const results = await vectorQuery.limit(overfetch).toArray();
    const rows = Array.isArray(results) ? results : [];
    return this.rankRows(rows, vector, topK, tenantId, true);
  }
}




