const router = require('express').Router();
const auth = require('../middleware/auth');
const Prize = require('../models/Prize');

// GET all prizes
router.get('/', async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ roundNo: 1 });
    res.json(prizes);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST upsert prize for a round
router.post('/', auth, async (req, res) => {
  const { roundNo, name, description, imageUrl } = req.body;
  if (!roundNo || !name) return res.status(400).json({ message: 'roundNo and name required' });
  try {
    const prize = await Prize.findOneAndUpdate(
      { roundNo },
      { name, description, imageUrl },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(prize);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT update prize
router.put('/:roundNo', auth, async (req, res) => {
  try {
    const prize = await Prize.findOneAndUpdate(
      { roundNo: req.params.roundNo },
      req.body,
      { new: true }
    );
    res.json(prize);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Batch save all 9 prizes at once
router.post('/batch', auth, async (req, res) => {
  const { prizes } = req.body; // array of { roundNo, name, description, imageUrl }
  try {
    const ops = prizes.map(p => ({
      updateOne: {
        filter: { roundNo: p.roundNo },
        update: { $set: { name: p.name, description: p.description || '', imageUrl: p.imageUrl || '' } },
        upsert: true,
      },
    }));
    await Prize.bulkWrite(ops);
    const all = await Prize.find().sort({ roundNo: 1 });
    res.json(all);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
