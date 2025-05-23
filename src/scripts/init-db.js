require('dotenv').config();
const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@plumeriaretreat.com',
      password: adminPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@plumeriaretreat.com');
    console.log('Password: admin123');

    // Create necessary directories
    const fs = require('fs');
    const path = require('path');
    const uploadDirs = ['uploads', 'uploads/accommodations', 'uploads/services', 'uploads/gallery'];
    
    for (const dir of uploadDirs) {
      const dirPath = path.join(__dirname, '../../', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }

    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 