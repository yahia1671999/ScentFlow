/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  CASHIER = "CASHIER",
  STOREKEEPER = "STOREKEEPER",
  ACCOUNTANT = "ACCOUNTANT",
  MARKETING = "MARKETING",
}

export enum ProductType {
  READY_PERFUME = "READY_PERFUME",
  OIL = "OIL",
  ALCOHOL = "ALCOHOL",
  BOTTLE = "BOTTLE",
  CARTON = "CARTON",
  SERVICE = "SERVICE",
}

export enum ProductCategory {
  RAW_MATERIAL = "RAW_MATERIAL",
  READY_PRODUCT = "READY_PRODUCT",
}

export enum UnitOfMeasure {
  UNIT = "unit",
  ML = "ml",
  LITER = "liter",
  CARTON = "carton",
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  type: ProductType;
  unit: UnitOfMeasure;
  costPrice: number;
  salePrice: number;
  stock: number;
  reorderLevel: number;
  barcode?: string;
  // For bottles
  fixedSize?: number; // e.g. 120ml
  isFlexibleSize?: boolean;
}

export interface PerfumeFormula {
  id: string;
  name: string;
  oilProductId: string; // Refers to the oil used
  defaultOilPercentage: number;
  allowedBottleSizes: number[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  qrCode: string;
  points: number;
  walletBalance: number;
  favoritePerfumes: string[]; // IDs
  favoriteScents: string[]; // Descriptive tags
  notes?: string;
  lastVisit: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId?: string; // Standard product
  perfumeFormulaId?: string; // Custom perfume
  bottleProductId?: string; // Bottle used for custom
  type: 'READY' | 'CUSTOM' | 'RAW';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Custom mixing details
  oilQuantity?: number;
  alcoholQuantity?: number;
  concentration?: number;
  bottleSize?: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  loyaltyUsed: number;
  total: number;
  paymentMethod: 'CASH' | 'WALLET' | 'BANK' | 'MOBILE';
  createdAt: string;
  cashierId: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  discount: number; // percentage or amount
  discountType: 'PERCENT' | 'FIXED';
  totalPrice: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  received: boolean;
  date: string;
  invoiceNumber?: string;
  attachmentUrl?: string; // Original invoice photo
}

export interface Return {
  id: string;
  originalId: string; // Sale ID or Purchase ID
  type: 'SALE' | 'PURCHASE';
  customerId?: string;
  supplierId?: string;
  items: SaleItem[]; // Items specifically returned
  totalAmount: number;
  total?: number; // Aliasing for convenience in some views
  reason: string;
  date: string;
}
