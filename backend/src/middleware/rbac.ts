import { Request, Response, NextFunction } from "express";
import { authenticateToken as authenticate, AuthRequest } from "./auth";

// Re-export authenticateToken as authMiddleware for compatibility
export const authMiddleware = authenticate;

// Role-based access control middleware factory
export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

// Admin-only middleware
export const adminOnly = rbacMiddleware(["SUPER_ADMIN", "FACILITY_ADMIN"]);

// Staff and above middleware
export const staffOnly = rbacMiddleware([
  "SUPER_ADMIN",
  "FACILITY_ADMIN",
  "FACILITY_STAFF",
  "BILLING_MANAGER",
]);

export default { authMiddleware, rbacMiddleware, adminOnly, staffOnly };
