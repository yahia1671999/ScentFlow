import { Database } from "better-sqlite3";
import { PurchaseRepository, ProductRepository, SupplierRepository } from "../repositories/index.js";
import { Purchase } from "../types.js";

/**
 * Service for managing purchases and related side effects.
 */
export class PurchaseService {
  constructor(
    private db: Database,
    private purchaseRepository: PurchaseRepository,
    private productRepository: ProductRepository,
    private supplierRepository: SupplierRepository
  ) {}

  getAllPurchases(tenantId: string) {
    return this.purchaseRepository.findAll(tenantId);
  }

  /**
   * Records a new purchase and updates inventory/supplier balances.
   */
  recordPurchase(purchaseData: any) {
    if (!purchaseData.tenantId) throw new Error("tenantId is required");
    const tenantId = purchaseData.tenantId;

    const purchase: Purchase = {
      ...purchaseData,
      id: "pur" + Date.now().toString() + Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString(),
    };

    const transaction = this.db.transaction((data: Purchase) => {
      // 1. Update inventory
      data.items.forEach((item: any) => {
        const prod = this.productRepository.findById(item.productId, tenantId);
        if (prod) {
          prod.stock += item.quantity;
          if (item.costPrice > 0) {
            prod.costPrice = item.costPrice;
          }
          this.productRepository.update(prod);
        }
      });

      // 2. Update supplier balance if partially paid
      if (data.total > data.paidAmount) {
        const supplier = this.supplierRepository.findById(data.supplierId, tenantId);
        if (supplier) {
          supplier.balance += (data.total - data.paidAmount);
          this.supplierRepository.update(supplier);
        }
      }

      // 3. Save purchase record
      this.purchaseRepository.create(data);
    });

    transaction(purchase);
    return purchase;
  }
}
