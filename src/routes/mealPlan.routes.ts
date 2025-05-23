import express from 'express';
import { adminAuth, checkPermission } from '../middleware/adminAuth';
import {
  createMealPlan,
  getMealPlans,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
} from '../controllers/mealPlanController';

const router = express.Router();

// Public routes
router.get('/', getMealPlans);
router.get('/:id', getMealPlanById);

// Protected routes
router.use(adminAuth);
router.post('/', checkPermission('manage_meal_plans'), createMealPlan);
router.put('/:id', checkPermission('manage_meal_plans'), updateMealPlan);
router.delete('/:id', checkPermission('manage_meal_plans'), deleteMealPlan);

export default router; 