import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-it-in-production";

/**
 * Middleware to authenticate requests via JWT.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    // Enforce tenant isolation by ensuring tenantId is always present in headers or token
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Middleware to restrict access based on permissions.
 */
export const permissionMiddleware = (permission: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ error: "Forbidden: No permissions found" });
    }

    if (req.user.permissions.includes(permission) || req.user.roles.includes("super_admin")) {
      next();
    } else {
      return res.status(403).json({ error: `Forbidden: Missing required permission [${permission}]` });
    }
  };
};

/**
 * Middleware to ensure a valid tenant is being accessed.
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenantId) {
    return res.status(400).json({ error: "Missing Tenant Identification" });
  }
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: {
        id: string;
        tenantId: string;
        username: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}
