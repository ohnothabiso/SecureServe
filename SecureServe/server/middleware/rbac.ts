import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth';

export type Role = 'ADMIN' | 'CLERK' | 'AUDITOR';

export function requireRole(allowedRoles: Role | Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role as Role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Convenience middlewares
export const requireAdmin = requireRole('ADMIN');
export const requireClerkOrAdmin = requireRole(['CLERK', 'ADMIN']);
export const requireAuditorOrAdmin = requireRole(['AUDITOR', 'ADMIN']);
export const requireAnyRole = requireRole(['ADMIN', 'CLERK', 'AUDITOR']);
