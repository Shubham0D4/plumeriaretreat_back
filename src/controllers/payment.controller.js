const { Payment, Booking } = require('../models');
const payuService = require('../services/payu.service');

class PaymentController {
  async initiatePayment(req, res) {
    try {
      const { bookingId, amount, paymentType } = req.body;
      
      const booking = await Booking.findByPk(bookingId, {
        include: ['User']
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Validate payment amount
      if (paymentType === 'partial') {
        const minPartialAmount = booking.totalPrice * 0.2; // 20% minimum
        if (amount < minPartialAmount) {
          return res.status(400).json({ 
            message: `Minimum partial payment amount is ${minPartialAmount}` 
          });
        }
      }

      const paymentData = {
        bookingId,
        amount,
        customerName: booking.User.name,
        customerEmail: booking.User.email,
        customerPhone: booking.User.phone,
        productInfo: `Booking for ${booking.accommodationId}`
      };

      const paymentInitiation = await payuService.initiatePayment(paymentData);

      // Create payment record
      await Payment.create({
        bookingId,
        amount,
        paymentType,
        status: 'pending',
        remainingAmount: booking.totalPrice - amount
      });

      res.json(paymentInitiation);
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ message: 'Failed to initiate payment' });
    }
  }

  async handlePaymentSuccess(req, res) {
    try {
      const paymentData = req.body;
      const verification = await payuService.verifyPayment(paymentData);

      if (!verification.isValid) {
        return res.status(400).json({ message: 'Invalid payment' });
      }

      const payment = await Payment.findOne({
        where: { bookingId: paymentData.bookingId },
        order: [['createdAt', 'DESC']]
      });

      if (!payment) {
        return res.status(404).json({ message: 'Payment record not found' });
      }

      // Update payment record
      await payment.update({
        status: 'success',
        payuTransactionId: verification.transactionId,
        payuPaymentId: verification.paymentId,
        paymentDate: new Date(),
        paymentResponse: paymentData
      });

      // Update booking payment status
      const booking = await Booking.findByPk(payment.bookingId);
      if (payment.paymentType === 'partial') {
        await booking.update({
          paymentStatus: 'partially_paid',
          paidAmount: booking.paidAmount + payment.amount,
          remainingAmount: booking.remainingAmount - payment.amount
        });
      } else {
        await booking.update({
          paymentStatus: 'paid',
          paidAmount: booking.totalPrice,
          remainingAmount: 0
        });
      }

      res.redirect(`${process.env.FRONTEND_URL}/payment-success?bookingId=${payment.bookingId}`);
    } catch (error) {
      console.error('Payment success handling error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/payment-failure`);
    }
  }

  async handlePaymentFailure(req, res) {
    try {
      const paymentData = req.body;
      
      const payment = await Payment.findOne({
        where: { bookingId: paymentData.bookingId },
        order: [['createdAt', 'DESC']]
      });

      if (payment) {
        await payment.update({
          status: 'failed',
          paymentResponse: paymentData
        });
      }

      res.redirect(`${process.env.FRONTEND_URL}/payment-failure?bookingId=${paymentData.bookingId}`);
    } catch (error) {
      console.error('Payment failure handling error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/payment-failure`);
    }
  }

  async getPaymentHistory(req, res) {
    try {
      const { bookingId } = req.params;
      
      const payments = await Payment.findAll({
        where: { bookingId },
        order: [['createdAt', 'DESC']]
      });

      res.json(payments);
    } catch (error) {
      console.error('Payment history error:', error);
      res.status(500).json({ message: 'Failed to fetch payment history' });
    }
  }
}

module.exports = new PaymentController(); 