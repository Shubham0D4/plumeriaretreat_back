const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});


// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'mysql.railway.internal',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'XuzzPuWFCRujAWxdWZTSwVBFVKdnNnJT',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// const dbConfig = {
//   host: 'localhost',
//   user: 'root',
//   password: '2005',
//   database: 'plumeria_retreat',
// };

const pool = mysql.createPool(dbConfig);
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// PayU Configuration
const PAYU_CONFIG = {
  merchantId: process.env.PAYU_MERCHANT_ID || 'gtKFFx',
  salt: process.env.PAYU_SALT || 'eCwWELxi',
  baseUrl: process.env.PAYU_BASE_URL || 'https://test.payu.in', // Use https://secure.payu.in for production
};

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility function to generate PayU hash
function generatePayUHash(txnid, amount, productinfo, firstname, email, salt) {
  const hashString = `${PAYU_CONFIG.merchantId}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  
  console.log("Hash String for PayU:", hashString);
  
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  // If PayU expects the versioned format, return as JSON
  // Note: This might be for their internal validation, but typically you send just the hex hash
  return hash
}

// Routes

// Get all accommodations
app.get('/api/accommodations', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM accommodations WHERE available = 1 ORDER BY price ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ error: 'Failed to fetch accommodations' });
  }
});

// Get all meal plans
app.get('/api/meal-plans', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM meal_plans WHERE available = 1 ORDER BY price ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// Get all activities
app.get('/api/activities', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM activities WHERE available = 1 ORDER BY price ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Check availability
app.post('/api/check-availability', async (req, res) => {
  try {
    const { accommodation_id, check_in_date, check_out_date, rooms } = req.body;

    // Check if dates are blocked
    const [blockedDates] = await pool.execute(
      'SELECT COUNT(*) as blocked_count FROM blocked_dates WHERE blocked_date BETWEEN ? AND ?',
      [check_in_date, check_out_date]
    );

    if (blockedDates[0].blocked_count > 0) {
      return res.json({ available: false, reason: 'Selected dates are blocked' });
    }

    // Check room availability
    const [bookedRooms] = await pool.execute(`
      SELECT COALESCE(SUM(b.rooms), 0) as booked_rooms 
      FROM bookings b 
      WHERE b.accommodation_id = ? 
      AND b.status NOT IN ('cancelled') 
      AND (
        (b.check_in_date <= ? AND b.check_out_date > ?) OR
        (b.check_in_date < ? AND b.check_out_date >= ?) OR
        (b.check_in_date >= ? AND b.check_out_date <= ?)
      )
    `, [accommodation_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]);

    const [accommodation] = await pool.execute(
      'SELECT available_rooms FROM accommodations WHERE id = ?',
      [accommodation_id]
    );

    const availableRooms = accommodation[0].available_rooms - bookedRooms[0].booked_rooms;
    const isAvailable = availableRooms >= rooms;

    res.json({ 
      available: isAvailable, 
      available_rooms: availableRooms,
      requested_rooms: rooms 
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Validate coupon
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code } = req.body;

    const [coupons] = await pool.execute(`
      SELECT * FROM coupons 
      WHERE code = ? 
      AND active = 1 
      AND (expiry_date IS NULL OR expiry_date >= CURDATE())
      AND (usage_limit IS NULL OR used_count < usage_limit)
    `, [code]);

    if (coupons.length === 0) {
      return res.json({ valid: false, message: 'Invalid or expired coupon' });
    }

    const coupon = coupons[0];
    res.json({ 
      valid: true, 
      discount: coupon.discount_percentage,
      min_amount: coupon.min_amount 
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      guest_name, guest_email, guest_phone, check_in_date, check_out_date,
      adults, children, accommodation_id, rooms, meal_plan_id, activities,
      coupon_code, total_amount
    } = req.body;

    // Create booking
    const [bookingResult] = await connection.execute(`
      INSERT INTO bookings (
        guest_name, guest_email, guest_phone, check_in_date, check_out_date,
        adults, children, accommodation_id, rooms, meal_plan_id, coupon_code,
        total_amount, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
    `, [
      guest_name, guest_email, guest_phone, check_in_date, check_out_date,
      adults, children, accommodation_id, rooms, meal_plan_id || null,
      coupon_code || null, total_amount
    ]);

    const bookingId = bookingResult.insertId;

    // Add activities
    if (activities && activities.length > 0) {
      for (const activityId of activities) {
        await connection.execute(
          'INSERT INTO booking_activities (booking_id, activity_id) VALUES (?, ?)',
          [bookingId, activityId]
        );
      }
    }

    // Update coupon usage if applicable
    if (coupon_code) {
      await connection.execute(
        'UPDATE coupons SET used_count = used_count + 1 WHERE code = ?',
        [coupon_code]
      );
    }

    await connection.commit();
    
    res.json({ 
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

// Get booking details
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

    // Get activities
    const [activities] = await pool.execute(`
      SELECT a.* FROM activities a
      JOIN booking_activities ba ON a.id = ba.activity_id
      WHERE ba.booking_id = ?
    `, [id]);

    booking.activities = activities;

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Initialize payment
app.post('/api/payment/initialize', async (req, res) => {
  try {
    const { booking_id } = req.body;

    // Get booking details
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    const txnid = `TXN${Date.now()}${booking_id}`;
    const amount = booking.total_amount.toString();
    const productinfo = `Plumeria Retreat Booking #${booking_id}`;
    const firstname = booking.guest_name.split(' ')[0];
    const email = booking.guest_email;

    // Generate hash
    const hash = generatePayUHash(txnid, amount, productinfo, firstname, email, PAYU_CONFIG.salt);

    // Store payment record
    await pool.execute(`
      INSERT INTO payments (booking_id, payment_id, amount, status) 
      VALUES (?, ?, ?, 'pending')
    `, [booking_id, txnid, amount]);

    // Update booking with payment ID
    await pool.execute(
      'UPDATE bookings SET payment_id = ? WHERE id = ?',
      [txnid, booking_id]
    );

    const payuData = {
      key: PAYU_CONFIG.merchantId,
      txnid: txnid,
      amount: amount,
      productinfo: productinfo,
      firstname: firstname,
      email: email,
      phone: booking.guest_phone || '',
      hash: hash,
      surl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success`,
      furl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/failure`,
      curl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
    };

    res.json({
      success: true,
      payment_url: `${PAYU_CONFIG.baseUrl}/_payment`,
      payment_data: payuData
    });

  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Payment callback/webhook
app.post('/api/payment/callback', async (req, res) => {
  try {
    const {
      txnid, amount, productinfo, firstname, email, status,
      hash, payuMoneyId, mihpayid
    } = req.body;

    // Verify hash for security
    const generatedHash = generatePayUHash(txnid, amount, productinfo, firstname, email, PAYU_CONFIG.salt);
    
    // Update payment status
    const paymentStatus = status === 'success' ? 'success' : 'failed';
    
    await pool.execute(`
      UPDATE payments 
      SET status = ?, payu_payment_id = ?, transaction_id = ?, gateway_response = ?
      WHERE payment_id = ?
    `, [paymentStatus, mihpayid, payuMoneyId, JSON.stringify(req.body), txnid]);

    // Update booking status
    const bookingStatus = status === 'success' ? 'confirmed' : 'pending';
    const paymentBookingStatus = status === 'success' ? 'paid' : 'failed';

    await pool.execute(`
      UPDATE bookings 
      SET status = ?, payment_status = ?
      WHERE payment_id = ?
    `, [bookingStatus, paymentBookingStatus, txnid]);

    // Send confirmation email if payment successful
    if (status === 'success') {
      // Get booking details for email
      const [bookings] = await pool.execute(`
        SELECT b.*, a.title as accommodation_title 
        FROM bookings b
        LEFT JOIN accommodations a ON b.accommodation_id = a.id
        WHERE b.payment_id = ?
      `, [txnid]);

      if (bookings.length > 0) {
        const booking = bookings[0];
        
        // Send confirmation email
        try {
          await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: booking.guest_email,
            subject: 'Booking Confirmation - Plumeria Retreat',
            html: `
              <h2>Booking Confirmed!</h2>
              <p>Dear ${booking.guest_name},</p>
              <p>Thank you for your booking. Your reservation has been confirmed.</p>
              <div>
                <h3>Booking Details:</h3>
                <p><strong>Booking ID:</strong> #${booking.id}</p>
                <p><strong>Check-in:</strong> ${booking.check_in_date}</p>
                <p><strong>Check-out:</strong> ${booking.check_out_date}</p>
                <p><strong>Accommodation:</strong> ${booking.accommodation_title}</p>
                <p><strong>Guests:</strong> ${booking.adults} Adults, ${booking.children} Children</p>
                <p><strong>Total Amount:</strong> ₹${booking.total_amount}</p>
                <p><strong>Payment ID:</strong> ${txnid}</p>
              </div>
              <p>We look forward to welcoming you to Plumeria Retreat!</p>
            `
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      }
    }

    res.json({ success: true, status: paymentStatus });

  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).json({ error: 'Failed to process payment callback' });
  }
});

// Get payment status
app.get('/api/payment/status/:txnid', async (req, res) => {
  try {
    const { txnid } = req.params;

    const [payments] = await pool.execute(`
      SELECT p.*, b.id as booking_id, b.guest_name, b.total_amount as booking_amount
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.payment_id = ?
    `, [txnid]);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payments[0]);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Get blocked dates
app.get('/api/blocked-dates', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT blocked_date FROM blocked_dates ORDER BY blocked_date'
    );
    res.json(rows.map(row => row.blocked_date));
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});


async function executeQuery(query) {
  try {
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}


app.get('/api/packages', async (req, res) => {
  try {
    const { active, limit, offset } = req.query;
    
    // `;
    const query = `select * from packages`;
    
   
    
    const packages = await executeQuery(query);
 
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch packages'
    });
  }
});

// GET /api/packages/:id - Get single package by ID
app.get('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = ` select * from packgaes where id = ? `;
    
    const packages = await executeQuery(query, [id]);
    
    if (packages.length === 0) {
      return res.status(404).json({
        error: 'Package not found'
      });
    }
    
    const pkg = packages[0];
    const formattedPackage = {
      ...pkg,
      includes: pkg.includes ? JSON.parse(pkg.includes) : [],
      accommodations: pkg.accommodations ? pkg.accommodations.split(',') : [],
      services: pkg.services ? pkg.services.split(',') : [],
      activities: pkg.activities ? pkg.activities.split(',') : [],
      active: Boolean(pkg.active),
      price: parseFloat(pkg.price)
    };
    
    res.json(formattedPackage);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch package'
    });
  }
});



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  await testConnection();
});

module.exports = app;
