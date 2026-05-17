import { PerfumeRepository } from "../repositories/index.js";
import { Perfume } from "../types.js";

export class PerfumeService {
  constructor(private perfumeRepository: PerfumeRepository) {}

  getAllFormulas(tenantId: string) {
    return this.perfumeRepository.findAll(tenantId);
  }

  createFormula(data: any) {
    if (!data.tenantId) throw new Error("tenantId is required");
    const formula: Perfume = {
      ...data,
      id: "p" + Date.now().toString() + Math.random().toString(36).substring(2, 6)
    };
    this.perfumeRepository.create(formula);
    return formula;
  }

  deleteFormula(id: string, tenantId: string) {
    this.perfumeRepository.delete(id, tenantId);
  }
}
