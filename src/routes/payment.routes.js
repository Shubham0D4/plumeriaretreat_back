const express = require('express');
const router = express.Router();
const { Payment, Booking, User } = require('../models');
const { auth } = require('../middleware/auth.middleware');
const payuConfig = require('../config/payu.config');
const paymentController = require('../controllers/payment.controller');

// Initialize payment
router.post('/initiate', auth, paymentController.initiatePayment);

// Payment success callback
router.post('/success', paymentController.handlePaymentSuccess);

// Payment failure callback
router.post('/failure', paymentController.handlePaymentFailure);

// Get payment history for a booking
router.get('/history/:bookingId', auth, paymentController.getPaymentHistory);

// Get payment status
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { bookingId: req.params.bookingId },
      order: [['createdAt', 'DESC']]
    });

    const totalPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const booking = await Booking.findByPk(req.params.bookingId);
    const remainingAmount = booking.totalPrice - totalPaid;

    res.json({
      payments,
      totalPaid,
      remainingAmount,
      isFullyPaid: remainingAmount === 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 