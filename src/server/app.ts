import db, { initDB } from "./db.js";
import { 
  UserRepository, ProductRepository, CustomerRepository, SaleRepository, 
  ExpenseRepository, SupplierRepository, PurchaseRepository, ReturnRepository, 
  PerfumeRepository, SettingsRepository, RoleRepository, PermissionRepository, AuditLogRepository, LicenseRepository, InventoryRepository,
  TenantRepository, SubscriptionRepository
} from "./repositories/index.js";
import { UserService } from "./services/UserService.js";
import { AuthService } from "./services/AuthService.js";
import { AuditLogService } from "./services/AuditLogService.js";
import { ProductService } from "./services/ProductService.js";
import { CustomerService } from "./services/CustomerService.js";
import { SaleService } from "./services/SaleService.js";
import { ExpenseService } from "./services/ExpenseService.js";
import { SupplierService } from "./services/SupplierService.js";
import { PurchaseService } from "./services/PurchaseService.js";
import { ReturnService } from "./services/ReturnService.js";
import { PerfumeService } from "./services/PerfumeService.js";
import { SettingsService } from "./services/SettingsService.js";
import { LicenseService } from "./services/LicenseService.js";
import { TenantService } from "./services/TenantService.js";
import { backupService } from "./backup/BackupService.js";

// Initialize DB schema
initDB();

// Repositories
const userRepo = new UserRepository(db);
const roleRepo = new RoleRepository(db);
const permissionRepo = new PermissionRepository(db);
const auditLogRepo = new AuditLogRepository(db);
const productRepo = new ProductRepository(db);
const customerRepo = new CustomerRepository(db);
const saleRepo = new SaleRepository(db);
const expenseRepo = new ExpenseRepository(db);
const supplierRepo = new SupplierRepository(db);
const purchaseRepo = new PurchaseRepository(db);
const returnRepo = new ReturnRepository(db);
const perfumeRepo = new PerfumeRepository(db);
const settingsRepo = new SettingsRepository(db);
const licenseRepo = new LicenseRepository(db);
const inventoryRepo = new InventoryRepository(db);
const tenantRepo = new TenantRepository(db);
const subscriptionRepo = new SubscriptionRepository(db);

// Services
export const userService = new UserService(userRepo);
export const authService = new AuthService(userRepo, roleRepo, permissionRepo);
export const auditLogService = new AuditLogService(auditLogRepo);
export const productService = new ProductService(productRepo);
export const customerService = new CustomerService(customerRepo);
export const saleService = new SaleService(db, saleRepo, productRepo, customerRepo);
export const expenseService = new ExpenseService(expenseRepo);
export const supplierService = new SupplierService(supplierRepo);
export const purchaseService = new PurchaseService(db, purchaseRepo, productRepo, supplierRepo);
export const returnService = new ReturnService(db, returnRepo, productRepo);
export const perfumeService = new PerfumeService(perfumeRepo);
export const settingsService = new SettingsService(settingsRepo);
export const licenseService = new LicenseService(licenseRepo, auditLogRepo, subscriptionRepo);
export const tenantService = new TenantService(tenantRepo, subscriptionRepo, userRepo, roleRepo);
export { backupService };

// Initial initialization
async function init() {
  await authService.initializeAuthPool();
  // settingsService.ensureSettingsExist(); // Tenant specific now
}

init().catch(console.error);
