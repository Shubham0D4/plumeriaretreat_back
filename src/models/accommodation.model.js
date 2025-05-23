const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Accommodation = sequelize.define('Accommodation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amenities: {
    type: DataTypes.JSON,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'maintenance', 'booked'),
    defaultValue: 'available'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Accommodation; 