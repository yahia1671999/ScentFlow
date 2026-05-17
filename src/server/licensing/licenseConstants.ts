export const DEFAULT_TRIAL_DAYS = 14;
export const DEFAULT_GRACE_DAYS = 7;

export const LICENSE_STATUSES = ["Active", "Expired", "Suspended", "Trial", "Deactivated"] as const;

export const MODULE_CODES = {
  POS: 'POS',
  INVENTORY: 'Inventory',
  SALES: 'Sales',
  PURCHASES: 'Purchases',
  RETURNS: 'Returns',
  CUSTOMERS: 'Customers',
  SUPPLIERS: 'Suppliers',
  REPORTS: 'Reports',
  SETTINGS: 'Settings'
} as const;

export const DEFAULT_ALLOWED_MODULES = Object.values(MODULE_CODES);
