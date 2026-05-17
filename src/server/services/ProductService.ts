import { ProductRepository } from "../repositories/index.js";
import { Product } from "../types.js";

/**
 * Service for managing product-related business logic.
 */
export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  getAllProducts(tenantId: string) {
    return this.productRepository.findAll(tenantId);
  }

  createProduct(productData: any) {
    if (!productData.tenantId) throw new Error("tenantId is required");
    const product: Product = {
      ...productData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    };
    this.productRepository.create(product);
    return product;
  }

  updateProduct(id: string, updateData: any) {
    if (!updateData.tenantId) throw new Error("tenantId is required");
    const existing = this.productRepository.findById(id, updateData.tenantId);
    if (!existing) throw new Error("Product not found");

    const updated = { ...existing, ...updateData };
    this.productRepository.update(updated);
    return updated;
  }

  deleteProduct(id: string, tenantId: string) {
    this.productRepository.delete(id, tenantId);
  }

  adjustStock(productId: string, quantity: number, tenantId: string) {
    const product = this.productRepository.findById(productId, tenantId);
    if (product) {
      product.stock += quantity;
      this.productRepository.update(product);
    }
  }
}
