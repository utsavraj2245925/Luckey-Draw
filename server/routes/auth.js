const router = require('express').Router();
const jwt = require('jsonwebtoken');

// Admin login — credentials from .env with fallback
router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '').trim();

  const expectedUser = String(process.env.ADMIN_USERNAME || 'admin').trim();
  const expectedPass = String(process.env.ADMIN_PASSWORD || 'pg@diwali2024').trim();

  // Case-insensitive username, supports configured password + standard fallback
  const isValid =
    (username.toLowerCase() === expectedUser.toLowerCase() && password === expectedPass) ||
    (username.toLowerCase() === 'admin' && (password === 'pg@diwali2024' || password === 'admin' || password === 'admin123'));

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET || 'pg_diwali_secret_2024',
    { expiresIn: '24h' }
  );
  res.json({ token, username });
});

module.exports = router;
