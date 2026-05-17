export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  logo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  createdAt: string;
  settings: any;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
  startDate: string;
  endDate: string;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  maxBranches: number;
  maxProducts: number;
  maxSalesPerMonth: number;
  features: string[];
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  productCode?: string;
  productName?: string;
  category?: string;
  barcode?: string;
  type: 'READY' | 'RAW';
  stock: number;
  unit: string;
  costPrice: number;
  salePrice: number;
  isActive?: boolean;
  [key: string]: any;
}

export interface Perfume {
  id: string;
  tenantId: string;
  name: string;
  [key: string]: any;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  customerCode?: string;
  phone?: string;
  address?: string;
  points: number;
  walletBalance: number;
  balance?: number;
  lastVisit: string;
  [key: string]: any;
}

export interface Sale {
  id: string;
  tenantId: string;
  invoiceNumber?: string;
  customerId?: string;
  items: any[];
  total: number;
  paidAmount?: number;
  paymentMethod?: string;
  createdAt: string;
  [key: string]: any;
}

export interface Expense {
  id: string;
  tenantId: string;
  amount: number;
  description: string;
  date: string;
  [key: string]: any;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  supplierCode?: string;
  phone?: string;
  address?: string;
  balance: number;
  [key: string]: any;
}

export interface Purchase {
  id: string;
  tenantId: string;
  invoiceNumber?: string;
  supplierId: string;
  items: any[];
  total: number;
  paidAmount: number;
  date: string;
  [key: string]: any;
}

export interface Return {
  id: string;
  tenantId: string;
  type: 'SALE' | 'PURCHASE';
  items: any[];
  totalAmount: number;
  date: string;
  [key: string]: any;
}

export interface Role {
  id: string;
  tenantId?: string; // Optional for system roles
  name: string;
  description?: string;
  permissions?: string[];
}

export interface Permission {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  tenantId: string;
  username: string;
  password?: string;
  role?: string; 
  roles?: string[]; 
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  [key: string]: any;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface AppSettings {
  id: string;
  tenantId: string;
  companyName: string;
  logo?: string;
  currency: string;
  taxNumber?: string;
  pointsEarningThreshold: number;
  pointsEarnedPerThreshold: number;
  pointValue: number;
  [key: string]: any;
}

export interface License {
  id: string;
  customerName: string;
  licenseKey: string;
  plan: 'Trial' | 'Basic' | 'Premium' | 'Enterprise';
  status: 'Active' | 'Expired' | 'Suspended' | 'Deactivated' | 'Trial';
  startDate: string;
  endDate: string;
  maxUsers: number;
  maxBranches: number;
  allowedModules: string[];
  gracePeriodDays: number;
  lastValidationDate: string;
  deviceId?: string;
  activatedMachine?: string;
  hardwareFingerprint?: string;
  licenseSignature?: string;
  signatureAlgorithm?: string;
  [key: string]: any;
}
