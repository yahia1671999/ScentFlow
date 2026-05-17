import { SupplierRepository } from "../repositories/index.js";
import { Supplier } from "../types.js";

export class SupplierService {
  constructor(private supplierRepository: SupplierRepository) {}

  getAllSuppliers(tenantId: string) {
    return this.supplierRepository.findAll(tenantId);
  }

  createSupplier(data: any) {
    if (!data.tenantId) throw new Error("tenantId is required");
    const supplier: Supplier = {
      ...data,
      id: "sup" + Date.now().toString() + Math.random().toString(36).substring(2, 6),
      balance: Number(data.balance || 0)
    };
    this.supplierRepository.create(supplier);
    return supplier;
  }

  updateSupplier(id: string, updateData: any) {
    if (!updateData.tenantId) throw new Error("tenantId is required");
    const existing = this.supplierRepository.findById(id, updateData.tenantId);
    if (!existing) throw new Error("Supplier not found");
    const updated = { ...existing, ...updateData };
    this.supplierRepository.update(updated);
    return updated;
  }

  deleteSupplier(id: string, tenantId: string) {
    this.supplierRepository.delete(id, tenantId);
  }
}
