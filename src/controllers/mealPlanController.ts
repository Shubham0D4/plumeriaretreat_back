import { Request, Response } from 'express';
import MealPlan from '../models/MealPlan';
import AdminActivityLog from '../models/AdminActivityLog';

interface AdminAuthRequest extends Request {
  admin?: any;
}

export const createMealPlan = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { name, description, price, type, menuItems } = req.body;

    const mealPlan = await MealPlan.create({
      name,
      description,
      price,
      type,
      menuItems,
    });

    // Log activity
    await AdminActivityLog.create({
      adminId: req.admin.id,
      action: 'create_meal_plan',
      description: `Created meal plan: ${name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(mealPlan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create meal plan' });
  }
};

export const getMealPlans = async (req: Request, res: Response) => {
  try {
    const mealPlans = await MealPlan.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(mealPlans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meal plans' });
  }
};

export const getMealPlanById = async (req: Request, res: Response) => {
  try {
    const mealPlan = await MealPlan.findByPk(req.params.id);
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meal plan' });
  }
};

export const updateMealPlan = async (req: AdminAuthRequest, res: Response) => {
  try {
    const mealPlan = await MealPlan.findByPk(req.params.id);
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    const { name, description, price, type, menuItems } = req.body;

    await mealPlan.update({
      name,
      description,
      price,
      type,
      menuItems,
    });

    // Log activity
    await AdminActivityLog.create({
      adminId: req.admin.id,
      action: 'update_meal_plan',
      description: `Updated meal plan: ${name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update meal plan' });
  }
};

export const deleteMealPlan = async (req: AdminAuthRequest, res: Response) => {
  try {
    const mealPlan = await MealPlan.findByPk(req.params.id);
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    await mealPlan.destroy();

    // Log activity
    await AdminActivityLog.create({
      adminId: req.admin.id,
      action: 'delete_meal_plan',
      description: `Deleted meal plan: ${mealPlan.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete meal plan' });
  }
}; 