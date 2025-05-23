const express = require('express');
const router = express.Router();
const { Booking, Accommodation, User } = require('../models');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// Get all bookings (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'phone'] },
        { model: Accommodation, attributes: ['id', 'name', 'type'] }
      ]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [{ model: Accommodation }]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: {
        id: req.params.id,
        ...(req.user.role !== 'admin' && { userId: req.user.id })
      },
      include: [
        { model: Accommodation },
        { model: User, attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { accommodationId, checkIn, checkOut, numberOfGuests, specialRequests } = req.body;

    // Check if accommodation exists and is available
    const accommodation = await Accommodation.findByPk(accommodationId);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    if (accommodation.status !== 'available') {
      return res.status(400).json({ message: 'Accommodation is not available' });
    }

    // Check for date conflicts
    const conflictingBooking = await Booking.findOne({
      where: {
        accommodationId,
        status: { [Op.ne]: 'cancelled' },
        [Op.or]: [
          {
            checkIn: {
              [Op.between]: [new Date(checkIn), new Date(checkOut)]
            }
          },
          {
            checkOut: {
              [Op.between]: [new Date(checkIn), new Date(checkOut)]
            }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Accommodation is not available for these dates' });
    }

    // Calculate total price (example: price per night * number of nights)
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalPrice = accommodation.price * nights;

    const booking = await Booking.create({
      userId: req.user.id,
      accommodationId,
      checkIn,
      checkOut,
      numberOfGuests,
      totalPrice,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending'
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update booking status (admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.update({ status });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: { [Op.notIn]: ['cancelled', 'completed'] }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or cannot be cancelled' });
    }

    await booking.update({
      status: 'cancelled',
      paymentStatus: 'refunded'
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get booking availability
router.get('/availability/:accommodationId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const bookings = await Booking.findAll({
      where: {
        accommodationId: req.params.accommodationId,
        status: { [Op.ne]: 'cancelled' },
        [Op.or]: [
          {
            checkIn: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          },
          {
            checkOut: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          }
        ]
      },
      attributes: ['checkIn', 'checkOut']
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 