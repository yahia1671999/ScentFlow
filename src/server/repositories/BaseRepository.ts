import { Database as SQLiteDatabase } from "better-sqlite3";

/**
 * Base Repository for common CRUD operations on JSON-stored entities.
 * Enforces Tenant Isolation by requiring tenantId for all operations.
 */
export class BaseRepository<T extends { id: string }> {
  constructor(protected db: SQLiteDatabase, protected tableName: string) {}

  /**
   * Fetches all entities from the table for a specific tenant.
   */
  findAll(tenantId?: string): T[] {
    const query = tenantId 
      ? `SELECT data FROM ${this.tableName} WHERE tenantId = ?`
      : `SELECT data FROM ${this.tableName}`;
    
    const stmt = this.db.prepare(query);
    const rows = tenantId ? stmt.all(tenantId) : stmt.all();
    return (rows as any[]).map((row: any) => JSON.parse(row.data));
  }

  /**
   * Fetches a single entity by its ID and tenantId.
   */
  findById(id: string, tenantId?: string): T | null {
    const query = tenantId 
      ? `SELECT data FROM ${this.tableName} WHERE id = ? AND tenantId = ?`
      : `SELECT data FROM ${this.tableName} WHERE id = ?`;
    
    const stmt = this.db.prepare(query);
    const row = tenantId ? stmt.get(id, tenantId) : stmt.get(id);
    return row ? JSON.parse((row as any).data) : null;
  }

  /**
   * Saves a new entity with tenantId.
   */
  create(entity: T & { tenantId?: string }): void {
    if (entity.tenantId) {
      this.db.prepare(`INSERT INTO ${this.tableName} (id, tenantId, data) VALUES (?, ?, ?)`)
        .run(entity.id, entity.tenantId, JSON.stringify(entity));
    } else {
      this.db.prepare(`INSERT INTO ${this.tableName} (id, data) VALUES (?, ?)`)
        .run(entity.id, JSON.stringify(entity));
    }
  }

  /**
   * Updates an existing entity ensuring tenant isolation.
   */
  update(entity: T & { tenantId?: string }): void {
    if (entity.tenantId) {
      this.db.prepare(`UPDATE ${this.tableName} SET data = ? WHERE id = ? AND tenantId = ?`)
        .run(JSON.stringify(entity), entity.id, entity.tenantId);
    } else {
      this.db.prepare(`UPDATE ${this.tableName} SET data = ? WHERE id = ?`)
        .run(JSON.stringify(entity), entity.id);
    }
  }

  /**
   * Deletes an entity by its ID and tenantId.
   */
  delete(id: string, tenantId?: string): void {
    if (tenantId) {
      this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ? AND tenantId = ?`)
        .run(id, tenantId);
    } else {
      this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`)
        .run(id);
    }
  }
}
