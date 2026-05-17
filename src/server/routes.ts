import { Router } from "express";
import { 
  userService, productService, customerService, saleService, 
  expenseService, supplierService, purchaseService, returnService, 
  perfumeService, settingsService, backupService, authService, auditLogService, licenseService, tenantService
} from "./app.js";
import { authMiddleware, permissionMiddleware } from "./middleware/auth.js";
import { moduleAccessMiddleware } from "./middleware/moduleAccess.js";

const router = Router();

/**
 * Auth Routes
 */
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await authService.login(username, password);
    if (result) {
      auditLogService.log(
        result.tenantId, 
        result.user.id, 
        result.user.username, 
        "LOGIN", 
        "AUTH", 
        result.user.id,
        undefined,
        req.ip,
        req.useragent?.source
      );
      res.json({ success: true, ...result });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // Fallback for legacy login if needed, or redirect to new login logic
  const result = await authService.login(username, password);
  if (result) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(401).json({ success: false, error: "Invalid credentials" });
  }
});

/**
 * Data Fetching (Scoped by Tenant)
 */
router.get("/data", authMiddleware, (req: any, res) => {
  try {
    const tid = req.tenantId!;
    const data = {
      products: productService.getAllProducts(tid),
      perfumes: perfumeService.getAllFormulas(tid),
      customers: customerService.getAllCustomers(tid),
      sales: saleService.getAllSales(tid),
      expenses: expenseService.getAllExpenses(tid),
      suppliers: supplierService.getAllSuppliers(tid),
      purchases: purchaseService.getAllPurchases(tid),
      returns: returnService.getAllReturns(tid),
      system_users: userService.getAllUsers(tid),
      settings: settingsService.getSettings(tid),
      audit_logs: auditLogService.getLogs(tid),
      tenant: tenantService.getTenant(tid)
    };
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Super Admin Routes
 */
router.post("/admin/tenants", authMiddleware, permissionMiddleware("manage_tenants"), async (req: any, res) => {
  try {
    const { name, adminUsername, adminPassword } = req.body;
    const tenant = await tenantService.createTenant(name, adminUsername, adminPassword);
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_TENANT", "TENANT", tenant.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(tenant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/admin/tenants", authMiddleware, permissionMiddleware("manage_tenants"), (req, res) => {
  try {
    res.json(tenantService.getAllTenants());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * User Management (Scoped)
 */
router.post("/users", authMiddleware, permissionMiddleware("manage_users"), async (req: any, res) => {
  try {
    const { password, ...userData } = req.body;
    const hashedPassword = await authService.hashPassword(password);
    const user = userService.createUser({ ...userData, tenantId: req.tenantId, password: hashedPassword });
    
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_USER", "USER", user.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: "Username already exists or invalid data" });
  }
});

router.post("/users/delete", authMiddleware, permissionMiddleware("manage_users"), (req: any, res) => {
  try {
    userService.deleteUser(req.body.id, req.tenantId!);
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "DELETE_USER", "USER", req.body.id, undefined, req.ip, req.useragent?.source);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Settings
 */
router.post("/settings/update", authMiddleware, permissionMiddleware("manage_settings"), (req: any, res) => {
  try {
    const settings = settingsService.updateSettings({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "UPDATE_SETTINGS", "SETTINGS", "global", undefined, req.ip, req.useragent?.source);
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * License Management
 */
router.get("/license/status", authMiddleware, permissionMiddleware("manage_settings"), (req: any, res) => {
  try {
    const status = licenseService.getLicenseStatus(req.tenantId!);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/license/activate", authMiddleware, permissionMiddleware("manage_settings"), (req, res) => {
  res.status(404).json({ error: "Not supported in SaaS version. Please use subscription management." });
});

router.post("/license/deactivate", authMiddleware, permissionMiddleware("manage_settings"), (req, res) => {
  res.status(404).json({ error: "Not supported in SaaS version" });
});

/**
 * Transactions
 */
router.post("/sales", authMiddleware, permissionMiddleware("create_sales"), moduleAccessMiddleware("POS"), (req: any, res) => {
  try {
    const sale = saleService.processSale({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_SALE", "SALE", sale.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(sale);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/purchases", authMiddleware, permissionMiddleware("manage_inventory"), (req: any, res) => {
  try {
    const purchase = purchaseService.recordPurchase({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "RECORD_PURCHASE", "PURCHASE", purchase.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(purchase);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/returns", authMiddleware, permissionMiddleware("manage_inventory"), (req: any, res) => {
  try {
    const ret = returnService.processReturn({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "PROCESS_RETURN", "RETURN", ret.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(ret);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Entities CRUD
 */
router.post("/customers", authMiddleware, (req: any, res) => {
  try {
    const customer = customerService.createCustomer({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_CUSTOMER", "CUSTOMER", customer.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/customers/update", authMiddleware, (req: any, res) => {
  try {
    const customer = customerService.updateCustomer(req.body.id, { ...req.body.data, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "UPDATE_CUSTOMER", "CUSTOMER", req.body.id, undefined, req.ip, req.useragent?.source);
    res.json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/products", authMiddleware, permissionMiddleware("manage_inventory"), moduleAccessMiddleware("Inventory"), (req: any, res) => {
  try {
    const product = productService.createProduct({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_PRODUCT", "PRODUCT", product.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/products/update", authMiddleware, permissionMiddleware("manage_inventory"), (req: any, res) => {
  try {
    const product = productService.updateProduct(req.body.id, { ...req.body.data, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "UPDATE_PRODUCT", "PRODUCT", req.body.id, undefined, req.ip, req.useragent?.source);
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/products/delete", authMiddleware, permissionMiddleware("manage_inventory"), (req: any, res) => {
  try {
    productService.deleteProduct(req.body.id, req.tenantId!);
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "DELETE_PRODUCT", "PRODUCT", req.body.id, undefined, req.ip, req.useragent?.source);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/expenses", authMiddleware, (req: any, res) => {
  try {
    const expense = expenseService.createExpense({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_EXPENSE", "EXPENSE", expense.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/formulas", authMiddleware, (req: any, res) => {
  try {
    const formula = perfumeService.createFormula({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_FORMULA", "FORMULA", formula.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(formula);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/formulas/delete", authMiddleware, (req: any, res) => {
  try {
    perfumeService.deleteFormula(req.body.id, req.tenantId!);
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "DELETE_FORMULA", "FORMULA", req.body.id, undefined, req.ip, req.useragent?.source);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/suppliers", authMiddleware, permissionMiddleware("manage_inventory"), (req: any, res) => {
  try {
    const supplier = supplierService.createSupplier({ ...req.body, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "CREATE_SUPPLIER", "SUPPLIER", supplier.id, undefined, req.ip, req.useragent?.source);
    res.status(201).json(supplier);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/suppliers/update", authMiddleware, permissionMiddleware("manage_inventory"), (req: any, res) => {
  try {
    const supplier = supplierService.updateSupplier(req.body.id, { ...req.body.data, tenantId: req.tenantId });
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "UPDATE_SUPPLIER", "SUPPLIER", req.body.id, undefined, req.ip, req.useragent?.source);
    res.json(supplier);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/suppliers/delete", authMiddleware, permissionMiddleware("manage_inventory"), (req: any, res) => {
  try {
    supplierService.deleteSupplier(req.body.id, req.tenantId!);
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "DELETE_SUPPLIER", "SUPPLIER", req.body.id, undefined, req.ip, req.useragent?.source);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Marketing (Legacy placeholder logic)
 */
router.post("/marketing/launch", authMiddleware, (req: any, res) => {
  const { segment, message } = req.body;
  console.log(`Launching campaign to ${segment}: ${message}`);
  auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "LAUNCH_CAMPAIGN", "MARKETING", segment, undefined, req.ip, req.useragent?.source);
  res.json({ success: true, message: "Campaign launched successfully" });
});

router.post("/marketing/schedule", authMiddleware, (req: any, res) => {
  const msg = req.body;
  console.log(`Scheduling message:`, msg);
  auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "SCHEDULE_MESSAGE", "MARKETING", undefined, undefined, req.ip, req.useragent?.source);
  res.json({ success: true, ...msg });
});

/**
 * System / Backup
 */
router.get("/system/db-info", authMiddleware, permissionMiddleware("manage_backup"), (req, res) => {
  try {
    const info = backupService.getDatabaseInfo();
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/system/backups", authMiddleware, permissionMiddleware("manage_backup"), (req, res) => {
  try {
    const backups = backupService.listBackups();
    res.json(backups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/system/backup", authMiddleware, permissionMiddleware("manage_backup"), async (req: any, res) => {
  try {
    const result = await backupService.createBackup();
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "DATABASE_BACKUP", "DATABASE", result.fileName, undefined, req.ip, req.useragent?.source);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/system/restore", authMiddleware, permissionMiddleware("restore_database"), async (req: any, res) => {
  try {
    const { backupPath } = req.body;
    if (!backupPath) {
      return res.status(400).json({ error: "backupPath is required" });
    }
    const result = await backupService.restoreFromBackup(backupPath);
    auditLogService.log(req.tenantId!, req.user!.id, req.user!.username, "DATABASE_RESTORE", "DATABASE", backupPath, undefined, req.ip, req.useragent?.source);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
