const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
db.init();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/properties — list all with follow-ups
app.get('/api/properties', (req, res) => {
  try {
    const properties = db.getAllProperties();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties — create property
app.post('/api/properties', (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    const property = db.createProperty(req.body);
    res.status(201).json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/properties/:id — update property fields
app.put('/api/properties/:id', (req, res) => {
  try {
    const existing = db.getPropertyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const property = db.updateProperty(req.params.id, req.body);
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/properties/:id — delete property + follow-ups
app.delete('/api/properties/:id', (req, res) => {
  try {
    const existing = db.getPropertyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Property not found' });
    }
    db.deleteProperty(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties/:id/followups — add follow-up
app.post('/api/properties/:id/followups', (req, res) => {
  try {
    const existing = db.getPropertyById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const { date, method } = req.body;
    if (!date || !method) {
      return res.status(400).json({ error: 'date and method are required' });
    }
    const followUp = db.createFollowUp(req.params.id, req.body);
    res.status(201).json(followUp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/followups/:id — delete a follow-up
app.delete('/api/followups/:id', (req, res) => {
  try {
    db.deleteFollowUp(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Follow-Up Tracker running at http://localhost:${PORT}`);
});
