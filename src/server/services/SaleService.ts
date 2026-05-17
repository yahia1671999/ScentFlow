import { Database } from "better-sqlite3";
import { SaleRepository, ProductRepository, CustomerRepository } from "../repositories/index.js";
import { Sale } from "../types.js";

/**
 * Service for managing sales and related side effects (stock, points).
 */
export class SaleService {
  constructor(
    private db: Database,
    private saleRepository: SaleRepository,
    private productRepository: ProductRepository,
    private customerRepository: CustomerRepository
  ) {}

  getAllSales(tenantId: string) {
    return this.saleRepository.findAll(tenantId);
  }

  /**
   * Processes a new sale, updating stock and customer loyalty points in a transaction.
   */
  processSale(saleData: any) {
    if (!saleData.tenantId) throw new Error("tenantId is required");
    const tenantId = saleData.tenantId;

    const sale: Sale = {
      ...saleData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    const transaction = this.db.transaction((data: Sale) => {
      // 1. Update inventory
      data.items.forEach((item: any) => {
        if (item.type === 'READY' || item.type === 'RAW') {
          const prod = this.productRepository.findById(item.productId, tenantId);
          if (prod) {
            prod.stock -= item.quantity;
            this.productRepository.update(prod);
          }
        } else if (item.type === 'CUSTOM') {
          // Deduct ingredients for custom perfumes
          if (item.oilProductId) {
            const oil = this.productRepository.findById(item.oilProductId, tenantId);
            if (oil) {
              oil.stock -= item.oilQuantity;
              this.productRepository.update(oil);
            }
          }
          if (item.alcoholProductId) {
            const alcohol = this.productRepository.findById(item.alcoholProductId, tenantId);
            if (alcohol) {
              alcohol.stock -= item.alcoholQuantity;
              this.productRepository.update(alcohol);
            }
          }
          if (item.bottleProductId) {
            const bottle = this.productRepository.findById(item.bottleProductId, tenantId);
            if (bottle) {
              bottle.stock -= item.quantity;
              this.productRepository.update(bottle);
            }
          }
        }
      });

      // 2. Update loyalty points
      if (data.customerId) {
        const customer = this.customerRepository.findById(data.customerId, tenantId);
        if (customer) {
          customer.points += Math.floor(data.total * 0.1);
          customer.lastVisit = new Date().toISOString();
          this.customerRepository.update(customer);
        }
      }

      // 3. Save sale record
      this.saleRepository.create(data);
    });

    transaction(sale);
    return sale;
  }
}
