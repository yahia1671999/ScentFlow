import { Database as SQLiteDatabase } from "better-sqlite3";
import { BaseRepository } from "./BaseRepository.js";
import { 
  User, Product, Customer, Sale, Expense, Supplier, Purchase, Return, 
  Perfume, AppSettings, Role, Permission, AuditLog, License,
  Tenant, Subscription, SubscriptionPlan
} from "../types.js";

export class TenantRepository extends BaseRepository<Tenant> {
  constructor(db: SQLiteDatabase) {
    super(db, "tenants");
  }

  // Override to find by ID without tenant isolation (admin duty)
  findDirect(id: string): Tenant | null {
    const row = this.db.prepare("SELECT data FROM tenants WHERE id = ?").get(id) as any;
    return row ? JSON.parse(row.data) : null;
  }

  // Create override because tenants table doesn't have tenantId column itself (id is the tenantId)
  create(tenant: Tenant): void {
    this.db.prepare("INSERT INTO tenants (id, name, status, data) VALUES (?, ?, ?, ?)")
      .run(tenant.id, tenant.name, tenant.status, JSON.stringify(tenant));
  }
}

export class SubscriptionRepository extends BaseRepository<Subscription> {
  constructor(db: SQLiteDatabase) {
    super(db, "subscriptions");
  }
}

export class UserRepository extends BaseRepository<User> {
  constructor(db: SQLiteDatabase) {
    super(db, "system_users");
  }

  findByUsername(username: string, tenantId: string): User | null {
    const row = this.db.prepare("SELECT data FROM system_users WHERE username = ? AND tenantId = ?").get(username, tenantId) as any;
    return row ? JSON.parse(row.data) : null;
  }

  create(user: User): void {
    this.db.prepare("INSERT INTO system_users (id, tenantId, username, password, role, data) VALUES (?, ?, ?, ?, ?, ?)")
      .run(user.id, user.tenantId, user.username, user.password, user.role || null, JSON.stringify(user));
  }

  update(user: User): void {
    this.db.prepare("UPDATE system_users SET username = ?, password = ?, role = ?, data = ? WHERE id = ? AND tenantId = ?")
      .run(user.username, user.password, user.role || null, JSON.stringify(user), user.id, user.tenantId);
  }

  getUserRoles(userId: string): string[] {
    return this.db.prepare("SELECT role_id FROM user_roles WHERE user_id = ?").all(userId).map((r: any) => r.role_id);
  }

  assignRole(userId: string, roleId: string, tenantId: string): void {
    this.db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role_id, tenantId) VALUES (?, ?, ?)").run(userId, roleId, tenantId);
  }
}

export class RoleRepository extends BaseRepository<Role> {
  constructor(db: SQLiteDatabase) {
    super(db, "roles");
  }

  create(role: Role): void {
    this.db.prepare("INSERT INTO roles (id, tenantId, name, data) VALUES (?, ?, ?, ?)")
      .run(role.id, role.tenantId || null, role.name, JSON.stringify(role));
  }

  getRolePermissions(roleId: string): string[] {
    return this.db.prepare("SELECT permission_id FROM role_permissions WHERE role_id = ?").all(roleId).map((p: any) => p.permission_id);
  }

  assignPermission(roleId: string, permissionId: string, tenantId: string): void {
    this.db.prepare("INSERT OR IGNORE INTO role_permissions (role_id, permission_id, tenantId) VALUES (?, ?, ?)").run(roleId, permissionId, tenantId);
  }
}

export class PermissionRepository extends BaseRepository<Permission> {
  constructor(db: SQLiteDatabase) {
    super(db, "permissions");
  }

  // Permissions are system-wide
  findAllDirect(): Permission[] {
    return this.db.prepare("SELECT data FROM permissions").all().map((r: any) => JSON.parse(r.data));
  }

  create(permission: Permission): void {
    this.db.prepare("INSERT INTO permissions (id, tenantId, name, data) VALUES (?, ?, ?, ?)").run(
      permission.id, permission.tenantId || 'system', permission.name, JSON.stringify(permission)
    );
  }
}

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor(db: SQLiteDatabase) {
    super(db, "audit_logs");
  }

  create(log: AuditLog): void {
    this.db.prepare("INSERT INTO audit_logs (id, tenantId, user_id, action, entity, timestamp, data) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      log.id, log.tenantId, log.userId, log.action, log.entity, log.timestamp, JSON.stringify(log)
    );
  }
}

export class InventoryRepository extends BaseRepository<any> {
  constructor(db: SQLiteDatabase) {
    super(db, "inventory");
  }

  create(record: any): void {
    this.db.prepare("INSERT INTO inventory (id, tenantId, productId, type, quantity, date, data) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(record.id, record.tenantId, record.productId, record.type, record.quantity, record.date, JSON.stringify(record));
  }
}

export class ProductRepository extends BaseRepository<Product> {
  constructor(db: SQLiteDatabase) {
    super(db, "products");
  }

  create(product: Product): void {
    this.db.prepare(`
      INSERT INTO products (id, tenantId, productCode, productName, category, barcode, salePrice, costPrice, stockQuantity, isActive, data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product.id, product.tenantId, product.productCode || null, product.name, product.category || null, product.barcode || null, 
      product.salePrice, product.costPrice, product.stock, product.isActive !== false ? 1 : 0, JSON.stringify(product)
    );
  }

  update(product: Product): void {
    this.db.prepare(`
      UPDATE products SET 
        productCode = ?, productName = ?, category = ?, barcode = ?, 
        salePrice = ?, costPrice = ?, stockQuantity = ?, isActive = ?, data = ? 
      WHERE id = ? AND tenantId = ?
    `).run(
      product.productCode || null, product.name, product.category || null, product.barcode || null, 
      product.salePrice, product.costPrice, product.stock, product.isActive !== false ? 1 : 0, JSON.stringify(product), product.id, product.tenantId
    );
  }
}

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(db: SQLiteDatabase) {
    super(db, "customers");
  }

  create(customer: Customer): void {
    this.db.prepare(`
      INSERT INTO customers (id, tenantId, customerCode, customerName, phone, address, balance, data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer.id, customer.tenantId, customer.customerCode || null, customer.name, customer.phone || null, customer.address || null, customer.walletBalance || 0, JSON.stringify(customer)
    );
  }

  update(customer: Customer): void {
    this.db.prepare(`
      UPDATE customers SET 
        customerCode = ?, customerName = ?, phone = ?, address = ?, balance = ?, data = ? 
      WHERE id = ? AND tenantId = ?
    `).run(
      customer.customerCode || null, customer.name, customer.phone || null, customer.address || null, customer.walletBalance || 0, JSON.stringify(customer), customer.id, customer.tenantId
    );
  }
}

export class SaleRepository extends BaseRepository<Sale> {
  constructor(db: SQLiteDatabase) {
    super(db, "sales");
  }

  create(sale: Sale): void {
    this.db.prepare(`
      INSERT INTO sales (id, tenantId, invoiceNumber, customerId, totalAmount, paidAmount, paymentMethod, invoiceDate, data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sale.id, sale.tenantId, sale.invoiceNumber || null, sale.customerId || null, sale.total, sale.paidAmount || sale.total, sale.paymentMethod || 'CASH', sale.createdAt, JSON.stringify(sale)
    );
  }

  update(sale: Sale): void {
    this.db.prepare(`
      UPDATE sales SET 
        invoiceNumber = ?, customerId = ?, totalAmount = ?, paidAmount = ?, paymentMethod = ?, invoiceDate = ?, data = ? 
      WHERE id = ? AND tenantId = ?
    `).run(
      sale.invoiceNumber || null, sale.customerId || null, sale.total, sale.paidAmount || sale.total, sale.paymentMethod || 'CASH', sale.createdAt, JSON.stringify(sale), sale.id, sale.tenantId
    );
  }
}

export class ExpenseRepository extends BaseRepository<Expense> {
  constructor(db: SQLiteDatabase) {
    super(db, "expenses");
  }
}

export class SupplierRepository extends BaseRepository<Supplier> {
  constructor(db: SQLiteDatabase) {
    super(db, "suppliers");
  }

  create(supplier: Supplier): void {
    this.db.prepare(`
      INSERT INTO suppliers (id, tenantId, supplierCode, supplierName, phone, address, balance, data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      supplier.id, supplier.tenantId, supplier.supplierCode || null, supplier.name, supplier.phone || null, supplier.address || null, supplier.balance || 0, JSON.stringify(supplier)
    );
  }

  update(supplier: Supplier): void {
    this.db.prepare(`
      UPDATE suppliers SET 
        supplierCode = ?, supplierName = ?, phone = ?, address = ?, balance = ?, data = ? 
      WHERE id = ? AND tenantId = ?
    `).run(
      supplier.supplierCode || null, supplier.name, supplier.phone || null, supplier.address || null, supplier.balance || 0, JSON.stringify(supplier), supplier.id, supplier.tenantId
    );
  }
}

export class PurchaseRepository extends BaseRepository<Purchase> {
  constructor(db: SQLiteDatabase) {
    super(db, "purchases");
  }

  create(purchase: Purchase): void {
    this.db.prepare(`
      INSERT INTO purchases (id, tenantId, invoiceNumber, supplierId, totalAmount, paidAmount, invoiceDate, data) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      purchase.id, purchase.tenantId, purchase.invoiceNumber || null, purchase.supplierId, purchase.total, purchase.paidAmount || 0, purchase.date, JSON.stringify(purchase)
    );
  }

  update(purchase: Purchase): void {
    this.db.prepare(`
      UPDATE purchases SET 
        invoiceNumber = ?, supplierId = ?, totalAmount = ?, paidAmount = ?, invoiceDate = ?, data = ? 
      WHERE id = ? AND tenantId = ?
    `).run(
      purchase.invoiceNumber || null, purchase.supplierId, purchase.total, purchase.paidAmount || 0, purchase.date, JSON.stringify(purchase), purchase.id, purchase.tenantId
    );
  }
}

export class ReturnRepository extends BaseRepository<Return> {
  constructor(db: SQLiteDatabase) {
    super(db, "returns");
  }
}

export class PerfumeRepository extends BaseRepository<Perfume> {
  constructor(db: SQLiteDatabase) {
    super(db, "perfumes");
  }
}

export class SettingsRepository extends BaseRepository<AppSettings> {
  constructor(db: SQLiteDatabase) {
    super(db, "app_settings");
  }

  getForTenant(tenantId: string): AppSettings | null {
    return this.findById("global", tenantId);
  }

  saveGlobal(settings: AppSettings): void {
    if (this.findById("global", settings.tenantId)) {
      this.update(settings);
    } else {
      this.create(settings);
    }
  }
}

export class LicenseRepository extends BaseRepository<License> {
  constructor(db: SQLiteDatabase) {
    super(db, "license_settings");
  }

  getLicense(tenantId: string): License | null {
    return this.findById("current_license", tenantId);
  }

  saveLicense(license: License): void {
    if (this.findById("current_license", license.tenantId)) {
      this.update(license);
    } else {
      this.create(license);
    }
  }
}
