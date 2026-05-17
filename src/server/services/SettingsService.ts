import { SettingsRepository } from "../repositories/index.js";
import { AppSettings } from "../types.js";

export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}

  getSettings(tenantId: string) {
    return this.settingsRepository.getForTenant(tenantId) || this.getDefaultSettings(tenantId);
  }

  updateSettings(data: any) {
    if (!data.tenantId) throw new Error("tenantId is required");
    const existing = this.settingsRepository.getForTenant(data.tenantId) || { id: "global", tenantId: data.tenantId } as AppSettings;
    const updated = { ...existing, ...data };
    this.settingsRepository.saveGlobal(updated);
    return updated;
  }

  private getDefaultSettings(tenantId: string): AppSettings {
    return {
      id: "global",
      tenantId,
      companyName: "ScentFlow ERP",
      companyPhone: "",
      currency: "EGP",
      invoiceHeader: "Thank you for shopping with us!",
      invoiceFooter: "All returns within 14 days with original receipt.",
      themeColor: "#d97706",
      pointsEarningThreshold: 100, 
      pointsEarnedPerThreshold: 10,
      pointValue: 1.0
    };
  }

  ensureSettingsExist(tenantId: string) {
    if (!this.settingsRepository.getForTenant(tenantId)) {
      this.settingsRepository.saveGlobal(this.getDefaultSettings(tenantId));
    }
  }
}
