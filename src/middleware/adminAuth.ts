import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser';

interface AdminAuthRequest extends Request {
  admin?: any;
}

export const adminAuth = async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const admin = await AdminUser.findOne({ where: { id: decoded.id, status: 'active' } });

    if (!admin) {
      throw new Error();
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate as admin' });
  }
};

export const checkPermission = (permission: string) => {
  return async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        throw new Error('Admin not authenticated');
      }

      // Super admin has all permissions
      if (admin.role === 'super_admin') {
        return next();
      }

      // Check if admin has the required permission
      const hasPermission = await admin.hasPermission(permission);
      
      if (!hasPermission) {
        throw new Error('Permission denied');
      }

      next();
    } catch (error) {
      res.status(403).json({ message: 'Permission denied' });
    }
  };
}; 