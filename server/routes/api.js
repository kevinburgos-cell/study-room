const express = require('express');
const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/profile
router.get('/profile', (req, res) => {
  res.json({ user: 'mock', email: 'test@example.com' });
});

module.exports = router;
