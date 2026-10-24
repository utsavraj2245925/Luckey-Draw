const router = require('express').Router();
const auth = require('../middleware/auth');
const DrawConfig = require('../models/DrawConfig');
const GameState  = require('../models/GameState');
const Winner     = require('../models/Winner');

// Save total card count
router.post('/config', auth, async (req, res) => {
  try {
    const { totalCards } = req.body;
    if (!totalCards || totalCards < 1)
      return res.status(400).json({ message: 'Invalid totalCards' });
    const groupSize = Math.ceil(totalCards / 3);
    const cfg = await DrawConfig.findOneAndUpdate(
      { singleton: 'config' },
      { totalCards, groupSize },
      { upsert: true, new: true }
    );
    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { totalEmployees: totalCards, groupSize, currentRound: 1, status: 'idle', isActive: false },
      { upsert: true }
    );
    await Winner.deleteMany({});
    res.json(cfg);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get current config
router.get('/config', auth, async (req, res) => {
  try {
    const cfg = await DrawConfig.findOne({ singleton: 'config' });
    res.json(cfg || { totalCards: 0, groupSize: 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
