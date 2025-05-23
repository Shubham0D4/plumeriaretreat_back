const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Bookings',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentType: {
    type: DataTypes.ENUM('partial', 'full'),
    allowNull: false
  },
  payuTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payuPaymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending'
  },
  paymentMode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  remainingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paymentResponse: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

module.exports = Payment; 