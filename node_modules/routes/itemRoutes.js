const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Item = require('../models/Item');
 
// CREATE
router.post('/', async (req, res) => {
  try {
    const item = new Item(req.body);
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// READ page of items
router.get('/', async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(Number.parseInt(req.query.limit, 10) || 10, 1);

  try {
    const [items, total] = await Promise.all([
      Item.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Item.countDocuments(),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/db-status', async (_req, res) => {
  const readyState = mongoose.connection.readyState;
  let status = readyState === 1 ? 'online' : readyState === 2 ? 'connecting' : 'offline';
  if (readyState === 1) {
    try {
      await mongoose.connection.db.admin().command({ ping: 1 });
    } catch {
      status = 'offline';
    }
  }
  res.status(status === 'online' ? 200 : 503).json({
    database: 'MongoDB',
    status,
    readyState,
  });
});

// SEARCH by name
router.get('/search', async (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'Search name is required' });

  try {
    const items = await Item.find({ name: { $regex: name, $options: 'i' } })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// READ one
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
 
// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;
