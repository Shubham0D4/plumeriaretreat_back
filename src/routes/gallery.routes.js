const express = require('express');
const router = express.Router();
const { Gallery } = require('../models');
const { auth, adminAuth } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gallery');
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

// Get all gallery images
router.get('/', async (req, res) => {
  try {
    const images = await Gallery.findAll({
      order: [
        ['featured', 'DESC'],
        ['order', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get gallery images by category
router.get('/category/:category', async (req, res) => {
  try {
    const images = await Gallery.findAll({
      where: { category: req.params.category },
      order: [
        ['featured', 'DESC'],
        ['order', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured gallery images
router.get('/featured', async (req, res) => {
  try {
    const images = await Gallery.findAll({
      where: { featured: true },
      order: [['order', 'ASC']]
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload new gallery image (admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const galleryImage = await Gallery.create({
      ...req.body,
      imageUrl: req.file.path
    });

    res.status(201).json(galleryImage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update gallery image (admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const galleryImage = await Gallery.findByPk(req.params.id);
    if (!galleryImage) {
      return res.status(404).json({ message: 'Gallery image not found' });
    }

    const updateData = {
      ...req.body,
      ...(req.file && { imageUrl: req.file.path })
    };

    await galleryImage.update(updateData);
    res.json(galleryImage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete gallery image (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const galleryImage = await Gallery.findByPk(req.params.id);
    if (!galleryImage) {
      return res.status(404).json({ message: 'Gallery image not found' });
    }

    await galleryImage.destroy();
    res.json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update image order (admin only)
router.put('/order/bulk', adminAuth, async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, order }
    
    for (const item of orders) {
      await Gallery.update(
        { order: item.order },
        { where: { id: item.id } }
      );
    }

    res.json({ message: 'Image orders updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 