import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

import { User } from '../models/user';

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    // Fetch the full user from DB and attach to req.user
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    (req as any).user = user;
    console.log('[DEBUG] Authenticated user:', user?.email, user?.adminType, user?.role);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to require a specific adminType (e.g., 'technicalAdmin')
export function requireRole(requiredAdminType: 'technical' | 'content' | 'financial' | 'super') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: only admins allowed' });
    }
    if (user.adminType === 'super') {
      return next(); // super admin bypasses all adminType checks
    }
    if (user.adminType !== requiredAdminType) {
      return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
    }
    next();
  };
}
