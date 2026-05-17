import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository, RoleRepository, PermissionRepository } from "../repositories/index.js";
import { User, Role, Permission } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-it-in-production";

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is missing. Development fallback is being used.");
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository
  ) {}

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateToken(user: Partial<User>, roles: string[], permissions: string[]): string {
    return jwt.sign(
      { 
        id: user.id, 
        tenantId: user.tenantId,
        username: user.username,
        roles,
        permissions
      }, 
      JWT_SECRET, 
      { expiresIn: "12h" }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  async login(username: string, password: string, tenantId?: string) {
    const searchUsername = username.toLowerCase();
    
    // For SaaS, we might need tenantId if username is not unique globally
    // If tenantId is not provided, we might have a common login where we find the user's tenants
    // For now, let's assume we find the user by username and get their tenantId
    
    const db = (this.userRepository as any).db;
    const userRow = db.prepare("SELECT tenantId, data FROM system_users WHERE username = ?").get(searchUsername);
    
    if (!userRow) return null;
    const user = JSON.parse(userRow.data) as User;

    const isValid = await this.comparePassword(password, user.password || "");
    if (!isValid) return null;

    if (user.status === 'SUSPENDED') {
      throw new Error("Account is suspended");
    }

    const userRoles = this.userRepository.getUserRoles(user.id);
    const permissionsSet = new Set<string>();

    for (const roleId of userRoles) {
      const rolePerms = this.roleRepository.getRolePermissions(roleId);
      rolePerms.forEach(p => permissionsSet.add(p));
    }

    const permissions = Array.from(permissionsSet);
    const token = this.generateToken(user, userRoles, permissions);

    const { password: _, ...userSafe } = user;
    return {
      token,
      user: { ...userSafe, roles: userRoles },
      permissions,
      tenantId: user.tenantId
    };
  }

  async initializeAuthPool() {
    // Ensure "default-tenant" exists for first run
    const db = (this.userRepository as any).db;
    const existingTenant = db.prepare("SELECT id FROM tenants WHERE id = ?").get("default-tenant");
    if (!existingTenant) {
      db.prepare("INSERT INTO tenants (id, name, status, data) VALUES (?, ?, ?, ?)")
        .run("default-tenant", "ScentFlow ERP", "ACTIVE", JSON.stringify({ id: "default-tenant", name: "ScentFlow ERP", status: "ACTIVE" }));
    }

    // 1. Create permissions
    const permissionsList: Permission[] = [
      { id: "view_sales", name: "View Sales" },
      { id: "create_sales", name: "Create Sales" },
      { id: "manage_inventory", name: "Manage Inventory" },
      { id: "manage_users", name: "Manage Users" },
      { id: "manage_backup", name: "Manage Backup" },
      { id: "restore_database", name: "Restore Database" },
      { id: "manage_settings", name: "Manage Settings" },
      { id: "manage_tenants", name: "Manage Tenants" },
      { id: "view_audit_logs", name: "View Audit Logs" }
    ];

    for (const p of permissionsList) {
      if (!this.permissionRepository.findById(p.id, "system")) { // System level permissions
        this.permissionRepository.create(p);
      }
    }

    // 2. Create default roles (Universal)
    const rolesList: Role[] = [
      { id: "super_admin", name: "Super Admin", permissions: permissionsList.map(p => p.id) },
      { id: "admin", name: "Admin", permissions: ["view_sales", "create_sales", "manage_inventory", "manage_settings", "view_audit_logs"] },
      { id: "cashier", name: "Cashier", permissions: ["view_sales", "create_sales"] },
      { id: "inventory_manager", name: "Inventory Manager", permissions: ["manage_inventory"] }
    ];

    for (const r of rolesList) {
      if (!this.roleRepository.findById(r.id, "system")) {
        const { permissions: perms, ...roleData } = r;
        this.roleRepository.create({ ...roleData, tenantId: "system" } as Role);
        perms?.forEach(pId => this.roleRepository.assignPermission(r.id, pId, "system"));
      }
    }

    // 3. Ensure super admin exists (requested: admin/123456)
    let existingAdmin = this.userRepository.findByUsername("admin", "default-tenant");
    
    if (!existingAdmin) {
      const hashedPassword = await this.hashPassword("123456");
      const adminUser: User = {
        id: "admin-1",
        tenantId: "default-tenant",
        username: "admin",
        password: hashedPassword,
        name: "System Administrator",
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      
      try {
        this.userRepository.create(adminUser);
        this.userRepository.assignRole(adminUser.id, "super_admin", "default-tenant");
        console.log("Default Super Admin created successfully");
      } catch (err) {
        console.error("Failed to create default super admin:", err);
      }
    }
  }
}
