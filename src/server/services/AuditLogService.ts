import { AuditLogRepository } from "../repositories/index.js";
import { AuditLog } from "../types.js";

export class AuditLogService {
  constructor(private auditLogRepository: AuditLogRepository) {}

  log(
    tenantId: string, 
    userId: string, 
    username: string, 
    action: string, 
    entity: string, 
    entityId?: string, 
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const logEntry: AuditLog = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      tenantId,
      userId,
      username,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      details,
      ipAddress,
      userAgent
    };
    this.auditLogRepository.create(logEntry);
  }

  getLogs(tenantId: string) {
    return this.auditLogRepository.findAll(tenantId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
