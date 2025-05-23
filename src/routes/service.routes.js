const express = require('express');
const router = express.Router();
const { Service } = require('../models');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/services');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create service (admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      image: req.file ? req.file.path : null
    };

    const service = await Service.create(serviceData);
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update service (admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const updateData = {
      ...req.body,
      ...(req.file && { image: req.file.path })
    };

    await service.update(updateData);
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete service (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await service.destroy();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const services = await Service.findAll({
      where: {
        category: req.params.category,
        isAvailable: true
      }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 