import { Request, Response, NextFunction } from "express";
import { licenseService } from "../app.js";

export const moduleAccessMiddleware = (moduleName: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!licenseService.canAccessModule(moduleName, req.tenantId!)) {
      return res.status(403).json({ 
        error: "Your current subscription plan does not allow access to this module.",
        module: moduleName
      });
    }
    next();
  };
};

/* 
Usage Example:
router.get("/inventory", authMiddleware, moduleAccessMiddleware("Inventory"), (req, res) => { ... });
*/
