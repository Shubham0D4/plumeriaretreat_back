const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  accommodationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Accommodations',
      key: 'id'
    }
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  numberOfGuests: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'partially_paid', 'paid', 'refunded'),
    defaultValue: 'pending'
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
});

module.exports = Booking; 