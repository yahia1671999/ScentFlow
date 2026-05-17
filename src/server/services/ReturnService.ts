import { Database } from "better-sqlite3";
import { ReturnRepository, ProductRepository } from "../repositories/index.js";
import { Return } from "../types.js";

/**
 * Service for managing product returns.
 */
export class ReturnService {
  constructor(
    private db: Database,
    private returnRepository: ReturnRepository,
    private productRepository: ProductRepository
  ) {}

  getAllReturns(tenantId: string) {
    return this.returnRepository.findAll(tenantId);
  }

  /**
   * Processes a return and adjusts stock levels accordingly.
   */
  processReturn(returnData: any) {
    if (!returnData.tenantId) throw new Error("tenantId is required");
    const tenantId = returnData.tenantId;

    const ret: Return = {
      ...returnData,
      id: "ret" + Date.now().toString() + Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString(),
    };

    const transaction = this.db.transaction((data: Return) => {
      data.items.forEach((item: any) => {
        const prod = this.productRepository.findById(item.productId, tenantId);
        if (prod) {
          if (data.type === 'SALE') {
            prod.stock += item.quantity; // Add back to stock
          } else {
            prod.stock -= item.quantity; // Remove from stock
          }
          this.productRepository.update(prod);
        }
      });

      this.returnRepository.create(data);
    });

    transaction(ret);
    return ret;
  }
}
