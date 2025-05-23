const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'plumeria_retreat'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();

// Routes

// Get all accommodations
app.get('/api/accommodations', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM accommodations WHERE available = true');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all meal plans
app.get('/api/meal-plans', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM meal_plans WHERE available = true');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all activities
app.get('/api/activities', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM activities WHERE available = true');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check coupon validity
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code } = req.body;
    
    const [rows] = await pool.execute(
      'SELECT * FROM coupons WHERE code = ? AND active = true AND (expiry_date IS NULL OR expiry_date >= CURDATE())',
      [code]
    );
    
    if (rows.length > 0) {
      res.json({
        valid: true,
        discount: rows[0].discount_percentage,
        type: rows[0].discount_type
      });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      guest_name,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
      adults,
      children,
      accommodation_id,
      rooms,
      meal_plan_id,
      activities,
      coupon_code,
      total_amount
    } = req.body;

    // Insert booking
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings (
        guest_name, guest_email, guest_phone, check_in_date, check_out_date,
        adults, children, accommodation_id, rooms, meal_plan_id, coupon_code,
        total_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        guest_name, guest_email, guest_phone, check_in_date, check_out_date,
        adults, children, accommodation_id, rooms, meal_plan_id, coupon_code,
        total_amount
      ]
    );

    const bookingId = bookingResult.insertId;

    // Insert activities
    if (activities && activities.length > 0) {
      for (const activityId of activities) {
        await connection.execute(
          'INSERT INTO booking_activities (booking_id, activity_id) VALUES (?, ?)',
          [bookingId, activityId]
        );
      }
    }

    // Update accommodation availability
    await connection.execute(
      'UPDATE accommodations SET available_rooms = available_rooms - ? WHERE id = ?',
      [rooms, accommodation_id]
    );

    await connection.commit();
    
    res.status(201).json({
      success: true,
      booking_id: bookingId,
      message: 'Booking created successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    connection.release();
  }
});

// Get booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [bookings] = await pool.execute(`
      SELECT b.*, a.title as accommodation_title, a.price as accommodation_price,
             m.title as meal_plan_title, m.price as meal_plan_price
      FROM bookings b
      LEFT JOIN accommodations a ON b.accommodation_id = a.id
      LEFT JOIN meal_plans m ON b.meal_plan_id = m.id
      WHERE b.id = ?
    `, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Get activities for this booking
    const [activities] = await pool.execute(`
      SELECT act.id, act.title, act.price
      FROM booking_activities ba
      JOIN activities act ON ba.activity_id = act.id
      WHERE ba.booking_id = ?
    `, [id]);

    booking.activities = activities;

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bookings (admin)
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.*, a.title as accommodation_title, m.title as meal_plan_title
      FROM bookings b
      LEFT JOIN accommodations a ON b.accommodation_id = a.id
      LEFT JOIN meal_plans m ON b.meal_plan_id = m.id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
app.patch('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({ success: true, message: 'Booking status updated' });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check availability
app.post('/api/check-availability', async (req, res) => {
  try {
    const { accommodation_id, check_in_date, check_out_date, rooms } = req.body;
    
    // Get total booked rooms for the date range
    const [bookedRooms] = await pool.execute(`
      SELECT COALESCE(SUM(rooms), 0) as total_booked
      FROM bookings 
      WHERE accommodation_id = ? 
        AND status IN ('confirmed', 'pending')
        AND (
          (check_in_date <= ? AND check_out_date > ?) OR
          (check_in_date < ? AND check_out_date >= ?) OR
          (check_in_date >= ? AND check_out_date <= ?)
        )
    `, [accommodation_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);
    
    // Get total available rooms
    const [accommodation] = await pool.execute(
      'SELECT available_rooms FROM accommodations WHERE id = ?',
      [accommodation_id]
    );
    
    const availableRooms = accommodation[0].available_rooms - bookedRooms[0].total_booked;
    const isAvailable = availableRooms >= rooms;
    
    res.json({
      available: isAvailable,
      available_rooms: Math.max(0, availableRooms)
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});