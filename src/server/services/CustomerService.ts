import { CustomerRepository } from "../repositories/index.js";
import { Customer } from "../types.js";

export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  getAllCustomers(tenantId: string) {
    return this.customerRepository.findAll(tenantId);
  }

  createCustomer(data: any) {
    if (!data.tenantId) throw new Error("tenantId is required");
    const customer: Customer = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      qrCode: `C-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      points: 0,
      walletBalance: 0,
      favoritePerfumes: [],
      favoriteScents: [],
      notes: "",
      lastVisit: new Date().toISOString()
    };
    this.customerRepository.create(customer);
    return customer;
  }

  updateCustomer(id: string, updateData: any) {
    if (!updateData.tenantId) throw new Error("tenantId is required");
    const existing = this.customerRepository.findById(id, updateData.tenantId);
    if (!existing) throw new Error("Customer not found");
    const updated = { ...existing, ...updateData };
    this.customerRepository.update(updated);
    return updated;
  }

  deleteCustomer(id: string, tenantId: string) {
    this.customerRepository.delete(id, tenantId);
  }
}
