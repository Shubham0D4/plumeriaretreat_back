import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import adminRoutes from './routes/adminRoutes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import accommodationRoutes from './routes/accommodation.routes';
import activityRoutes from './routes/activity.routes';
import mealPlanRoutes from './routes/mealPlan.routes';

// Load environment variables
config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/meal-plans', mealPlanRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app; 