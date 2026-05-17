import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Going up one level from src/server to root
const DB_DIR = path.join(__dirname, "../..", "server/database");
const DB_FILE = path.join(DB_DIR, "data.db");

// Ensure directory exists
import fs from "fs";
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_FILE);

// Set pragmas for production security and performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

/**
 * Initializes the database tables if they do not exist.
 */
export function initDB() {
  db.exec(`
    -- SaaS Core Tables
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL,
      maxUsers INTEGER,
      maxBranches INTEGER,
      maxProducts INTEGER,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      planId TEXT,
      status TEXT,
      startDate TEXT,
      endDate TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );

    -- Business Tables
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS perfumes (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS system_users (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT,
      data TEXT NOT NULL,
      UNIQUE(tenantId, username),
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      UNIQUE(tenantId, name)
    );
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      name TEXT UNIQUE NOT NULL,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT,
      permission_id TEXT,
      tenantId TEXT,
      PRIMARY KEY (role_id, permission_id)
    );
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT,
      role_id TEXT,
      tenantId TEXT,
      PRIMARY KEY (user_id, role_id)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      user_id TEXT,
      action TEXT,
      entity TEXT,
      timestamp TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL,
      UNIQUE(tenantId, id)
    );
    CREATE TABLE IF NOT EXISTS license_settings (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      productId TEXT,
      type TEXT, -- IN, OUT, ADJUST
      quantity REAL,
      date TEXT,
      data TEXT NOT NULL
    );
  `);

  /**
   * DATABASE NORMALIZATION FOUNDATION
   * Strategy: Add explicit columns for core business fields while preserving the JSON 'data' column.
   */

  // Function to safely add column
  const addColumn = (table: string, column: string, type: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    if (!cols.some(c => c.name === column)) {
      console.log(`Migrating ${table}: Adding column ${column}...`);
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    }
  };

  const tablesToUpdate = [
    'products', 'perfumes', 'customers', 'sales', 'expenses', 
    'suppliers', 'purchases', 'returns', 'system_users', 
    'roles', 'audit_logs', 'app_settings', 'license_settings', 'inventory',
    'permissions', 'role_permissions', 'user_roles'
  ];

  tablesToUpdate.forEach(table => addColumn(table, 'tenantId', 'TEXT'));

  // Products Normalization
  addColumn('products', 'productCode', 'TEXT');
  addColumn('products', 'productName', 'TEXT');
  addColumn('products', 'category', 'TEXT');
  addColumn('products', 'barcode', 'TEXT');
  addColumn('products', 'salePrice', 'REAL');
  addColumn('products', 'costPrice', 'REAL');
  addColumn('products', 'stockQuantity', 'REAL');
  addColumn('products', 'isActive', 'INTEGER DEFAULT 1');

  // Customers Normalization
  addColumn('customers', 'customerCode', 'TEXT');
  addColumn('customers', 'customerName', 'TEXT');
  addColumn('customers', 'phone', 'TEXT');
  addColumn('customers', 'address', 'TEXT');
  addColumn('customers', 'balance', 'REAL');

  // Suppliers Normalization
  addColumn('suppliers', 'supplierCode', 'TEXT');
  addColumn('suppliers', 'supplierName', 'TEXT');
  addColumn('suppliers', 'phone', 'TEXT');
  addColumn('suppliers', 'address', 'TEXT');
  addColumn('suppliers', 'balance', 'REAL');

  // Sales Normalization
  addColumn('sales', 'invoiceNumber', 'TEXT');
  addColumn('sales', 'customerId', 'TEXT');
  addColumn('sales', 'totalAmount', 'REAL');
  addColumn('sales', 'paidAmount', 'REAL');
  addColumn('sales', 'paymentMethod', 'TEXT');
  addColumn('sales', 'invoiceDate', 'TEXT');

  // Purchases Normalization
  addColumn('purchases', 'invoiceNumber', 'TEXT');
  addColumn('purchases', 'supplierId', 'TEXT');
  addColumn('purchases', 'totalAmount', 'REAL');
  addColumn('purchases', 'paidAmount', 'REAL');
  addColumn('purchases', 'invoiceDate', 'TEXT');

  // Create Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenantId);
    CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenantId);
    CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenantId);
    CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenantId);
    CREATE INDEX IF NOT EXISTS idx_users_tenant ON system_users(tenantId);
    
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(productCode);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customerCode);
    CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplierCode);
    CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoiceNumber);
    CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoiceNumber);
  `);

  // Default Tenant Migration logic could go here if needed
  
  // Data Migration Helper
  const migrateTableData = (table: string, mapper: (data: any) => any) => {
    const rows = db.prepare(`SELECT id, data FROM ${table}`).all() as any[];
    for (const row of rows) {
      try {
        const data = JSON.parse(row.data);
        const mapped = mapper(data);
        
        // Find columns with values to update
        const keys = Object.keys(mapped);
        if (keys.length === 0) continue;
        
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => mapped[k]);
        
        db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, row.id);
      } catch (e) {
        console.error(`Failed to migrate row ${row.id} in ${table}`, e);
      }
    }
  };

  // Run migrations (only if needed, checked by whether column is null in first row)
  // For simplicity here, we run it once if we just added columns
  console.log('Running data migration for normalized columns...');
  
  migrateTableData('products', (d) => ({
    productName: d.name,
    salePrice: d.salePrice,
    costPrice: d.costPrice,
    stockQuantity: d.stock,
    isActive: d.isActive !== undefined ? (d.isActive ? 1 : 0) : 1
  }));

  migrateTableData('customers', (d) => ({
    customerName: d.name,
    balance: d.walletBalance || 0
  }));

  migrateTableData('suppliers', (d) => ({
    supplierName: d.name,
    balance: d.balance || 0
  }));

  migrateTableData('sales', (d) => ({
    totalAmount: d.total,
    invoiceDate: d.createdAt,
    customerId: d.customerId
  }));

  migrateTableData('purchases', (d) => ({
    supplierId: d.supplierId,
    totalAmount: d.total,
    paidAmount: d.paidAmount,
    invoiceDate: d.date
  }));

  // Migration for license_settings
  const licenseCols = db.prepare("PRAGMA table_info(license_settings)").all() as any[];
  const colNames = licenseCols.map(c => c.name);

  if (!colNames.includes('deviceId')) {
    console.log('Migrating license_settings: Adding deviceId...');
    db.prepare("ALTER TABLE license_settings ADD COLUMN deviceId TEXT").run();
  }
  if (!colNames.includes('activatedMachine')) {
    console.log('Migrating license_settings: Adding activatedMachine...');
    db.prepare("ALTER TABLE license_settings ADD COLUMN activatedMachine TEXT").run();
  }
  if (!colNames.includes('hardwareFingerprint')) {
    console.log('Migrating license_settings: Adding hardwareFingerprint...');
    db.prepare("ALTER TABLE license_settings ADD COLUMN hardwareFingerprint TEXT").run();
  }
  if (!colNames.includes('licenseSignature')) {
    console.log('Migrating license_settings: Adding licenseSignature...');
    db.prepare("ALTER TABLE license_settings ADD COLUMN licenseSignature TEXT").run();
  }
  if (!colNames.includes('signatureAlgorithm')) {
    console.log('Migrating license_settings: Adding signatureAlgorithm...');
    db.prepare("ALTER TABLE license_settings ADD COLUMN signatureAlgorithm TEXT").run();
  }
}

export default db;
