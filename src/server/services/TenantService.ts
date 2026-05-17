import { TenantRepository, SubscriptionRepository, UserRepository, RoleRepository } from "../repositories/index.js";
import { Tenant, Subscription, User, Role } from "../types.js";
import bcrypt from "bcryptjs";

export class TenantService {
  constructor(
    private tenantRepo: TenantRepository,
    private subscriptionRepo: SubscriptionRepository,
    private userRepo: UserRepository,
    private roleRepo: RoleRepository
  ) {}

  async createTenant(name: string, adminUsername: string, adminPassword: string): Promise<Tenant> {
    const tenantId = "tnt-" + Math.random().toString(36).substring(2, 9);
    
    const tenant: Tenant = {
      id: tenantId,
      name,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      settings: {}
    };

    this.tenantRepo.create(tenant);

    // Create default subscription (Trial)
    const subscription: Subscription = {
      id: "sub-" + Math.random().toString(36).substring(2, 9),
      tenantId,
      planId: "trial",
      status: 'TRIALING',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      cancelAtPeriodEnd: false
    };
    this.subscriptionRepo.create(subscription);

    // Create Initial Admin User for this Tenant
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser: User = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      tenantId,
      username: adminUsername.toLowerCase(),
      password: hashedPassword,
      name: "Tenant Admin",
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.userRepo.create(adminUser);
    this.userRepo.assignRole(adminUser.id, "admin", tenantId);

    return tenant;
  }

  getTenant(tenantId: string): Tenant | null {
    return this.tenantRepo.findDirect(tenantId);
  }

  getAllTenants(): Tenant[] {
    // Direct find all for super admin
    const rows = (this.tenantRepo as any).db.prepare("SELECT data FROM tenants").all();
    return rows.map((r: any) => JSON.parse(r.data));
  }
}
