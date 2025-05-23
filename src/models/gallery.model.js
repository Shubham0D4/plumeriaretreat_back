const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gallery = sequelize.define('Gallery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Gallery; 