import { Request, Response } from 'express';
import Activity from '../models/Activity';
import AdminActivityLog from '../models/AdminActivityLog';

interface AdminAuthRequest extends Request {
  admin?: any;
}

export const createActivity = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { name, description, duration, price, maxParticipants, imageUrl } = req.body;

    const activity = await Activity.create({
      name,
      description,
      duration,
      price,
      maxParticipants,
      imageUrl,
    });

    // Log activity
    await AdminActivityLog.create({
      adminId: req.admin.id,
      action: 'create_activity',
      description: `Created activity: ${name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create activity' });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await Activity.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
};

export const updateActivity = async (req: AdminAuthRequest, res: Response) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const { name, description, duration, price, maxParticipants, imageUrl } = req.body;

    await activity.update({
      name,
      description,
      duration,
      price,
      maxParticipants,
      imageUrl,
    });

    // Log activity
    await AdminActivityLog.create({
      adminId: req.admin.id,
      action: 'update_activity',
      description: `Updated activity: ${name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update activity' });
  }
};

export const deleteActivity = async (req: AdminAuthRequest, res: Response) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    await activity.destroy();

    // Log activity
    await AdminActivityLog.create({
      adminId: req.admin.id,
      action: 'delete_activity',
      description: `Deleted activity: ${activity.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete activity' });
  }
}; 