import { UserRepository } from "../repositories/index.js";
import { User } from "../types.js";

export class UserService {
  constructor(private userRepository: UserRepository) {}

  getAllUsers(tenantId: string) {
    return this.userRepository.findAll(tenantId).map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
  }

  createUser(data: any) {
    if (!data.tenantId) throw new Error("tenantId is required");
    const { roles: rolesToAssign, ...userData } = data;
    const user: User = {
      id: "u" + Date.now().toString() + Math.random().toString(36).substring(2, 6),
      tenantId: userData.tenantId,
      username: userData.username.toLowerCase(),
      password: userData.password,
      name: userData.name,
      role: userData.role, 
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    this.userRepository.create(user);
    
    // Assign roles
    if (rolesToAssign && Array.isArray(rolesToAssign)) {
      rolesToAssign.forEach(roleId => this.userRepository.assignRole(user.id, roleId, user.tenantId!));
    } else if (userData.role) {
      const mapping: Record<string, string> = {
        'ADMIN': 'admin',
        'CASHIER': 'cashier',
        'MANAGER': 'inventory_manager'
      };
      const newRoleId = mapping[userData.role] || 'cashier';
      this.userRepository.assignRole(user.id, newRoleId, user.tenantId!);
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  deleteUser(id: string, tenantId: string) {
    if (id === 'admin-1') throw new Error("Cannot delete master administrator");
    this.userRepository.delete(id, tenantId);
  }
}
