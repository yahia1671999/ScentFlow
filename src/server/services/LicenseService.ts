import { LicenseRepository, AuditLogRepository, SubscriptionRepository } from "../repositories/index.js";
import { License, AuditLog, Subscription } from "../types.js";

export class LicenseService {
  constructor(
    private licenseRepository: LicenseRepository,
    private auditLogRepository: AuditLogRepository,
    private subscriptionRepository: SubscriptionRepository
  ) {}

  getLicenseStatus(tenantId: string) {
    const subscriptions = this.subscriptionRepository.findAll(tenantId);
    if (!subscriptions || subscriptions.length === 0) return { isActive: false, plan: 'none' };
    
    // Find active subscription
    const activeSub = subscriptions.find(s => s.status === 'ACTIVE' || s.status === 'TRIALING');
    if (!activeSub) return { isActive: false, plan: 'none' };

    const now = new Date();
    const endDate = new Date(activeSub.endDate);
    const isActive = now <= endDate;

    return {
      isActive,
      plan: activeSub.planId,
      endDate: activeSub.endDate,
      status: activeSub.status
    };
  }

  canAccessModule(moduleName: string, tenantId: string) {
    const status = this.getLicenseStatus(tenantId);
    if (!status.isActive) return false;
    
    // Simple plan-based access for now
    if (status.plan === 'starter' && ['marketing', 'reports'].includes(moduleName.toLowerCase())) {
       return false;
    }
    return true;
  }
}
