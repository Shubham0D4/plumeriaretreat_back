const express = require('express');
const router = express.Router();
const { Accommodation } = require('../models');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/accommodations');
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

// Get all accommodations
router.get('/', async (req, res) => {
  try {
    const accommodations = await Accommodation.findAll();
    res.json(accommodations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single accommodation
router.get('/:id', async (req, res) => {
  try {
    const accommodation = await Accommodation.findByPk(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    res.json(accommodation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create accommodation (admin only)
router.post('/', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => file.path) : [];
    const accommodation = await Accommodation.create({
      ...req.body,
      images,
      amenities: JSON.parse(req.body.amenities || '[]')
    });
    res.status(201).json(accommodation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update accommodation (admin only)
router.put('/:id', adminAuth, upload.array('images', 5), async (req, res) => {
  try {
    const accommodation = await Accommodation.findByPk(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    const images = req.files ? req.files.map(file => file.path) : undefined;
    const updateData = {
      ...req.body,
      ...(images && { images }),
      ...(req.body.amenities && { amenities: JSON.parse(req.body.amenities) })
    };

    await accommodation.update(updateData);
    res.json(accommodation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete accommodation (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const accommodation = await Accommodation.findByPk(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    await accommodation.destroy();
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search accommodations
router.get('/search', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, capacity } = req.query;
    const where = {};

    if (type) where.type = type;
    if (capacity) where.capacity = { [Op.gte]: parseInt(capacity) };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    const accommodations = await Accommodation.findAll({ where });
    res.json(accommodations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 