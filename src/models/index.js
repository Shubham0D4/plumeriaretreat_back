const sequelize = require('../config/database');
const User = require('./user.model');
const Accommodation = require('./accommodation.model');
const Booking = require('./booking.model');
const Service = require('./service.model');
const Gallery = require('./gallery.model');
const Payment = require('./payment.model');

// User - Booking associations
User.hasMany(Booking);
Booking.belongsTo(User);

// Accommodation - Booking associations
Accommodation.hasMany(Booking);
Booking.belongsTo(Accommodation);

// Accommodation - Gallery associations
Accommodation.hasMany(Gallery);
Gallery.belongsTo(Accommodation);

// Booking - Payment associations
Booking.hasMany(Payment);
Payment.belongsTo(Booking);

module.exports = {
  sequelize,
  User,
  Accommodation,
  Booking,
  Service,
  Gallery,
  Payment
}; 