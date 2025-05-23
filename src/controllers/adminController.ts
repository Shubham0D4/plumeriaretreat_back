import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser';
import AdminActivityLog from '../models/AdminActivityLog';
import AdminSetting from '../models/AdminSetting';
import { Op } from 'sequelize';

interface AdminAuthRequest extends Request {
  admin?: any;
}

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const admin = await AdminUser.findOne({ where: { username } });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await admin.update({ lastLogin: new Date() });

    // Log activity
    await AdminActivityLog.create({
      adminId: admin.id,
      action: 'login',
      description: 'Admin logged in',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminProfile = async (req: AdminAuthRequest, res: Response) => {
  try {
    const admin = req.admin;
    res.json({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      lastLogin: admin.lastLogin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminProfile = async (req: AdminAuthRequest, res: Response) => {
  try {
    const admin = req.admin;
    const { email, currentPassword, newPassword } = req.body;

    if (email) {
      admin.email = email;
    }

    if (currentPassword && newPassword) {
      const isValid = await admin.comparePassword(currentPassword);
      if (!isValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      admin.password = newPassword;
    }

    await admin.save();

    // Log activity
    await AdminActivityLog.create({
      adminId: admin.id,
      action: 'update_profile',
      description: 'Admin updated profile',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    const settings = await AdminSetting.findAll();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminSetting = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    const admin = req.admin;

    const setting = await AdminSetting.findOne({ where: { settingKey: key } });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    await setting.update({
      settingValue: value,
      updatedBy: admin.id,
    });

    // Log activity
    await AdminActivityLog.create({
      adminId: admin.id,
      action: 'update_setting',
      description: `Updated setting: ${key}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getActivityLogs = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const logs = await AdminActivityLog.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: AdminUser,
          attributes: ['username', 'email'],
        },
      ],
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      pages: Math.ceil(logs.count / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 