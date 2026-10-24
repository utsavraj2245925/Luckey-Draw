const router = require('express').Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const GameState  = require('../models/GameState');
const Winner     = require('../models/Winner');
const Prize      = require('../models/Prize');
const DrawConfig = require('../models/DrawConfig');

function getGroupRange(group, groupSize, totalCards) {
  const start = (group - 1) * groupSize + 1;
  const end   = group === 3 ? totalCards : group * groupSize;
  return { start, end };
}

function groupForRound(round) {
  if (round <= 3) return 1;
  if (round <= 6) return 2;
  return 3;
}

// POST /start
router.post('/start', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { isActive: true, status: 'idle', currentRound: 1 },
      { upsert: true }
    );
    io.emit('game:start');
    res.json({ message: 'Game started successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /spin
router.post('/spin', auth, async (req, res) => {
  try {
    const io     = req.app.get('io');
    const state  = await GameState.findOne({ singleton: 'state' });
    const config = await DrawConfig.findOne({ singleton: 'config' });

    if (!state || !config || config.totalCards === 0)
      return res.status(400).json({ message: 'Configure total cards first' });
    if (state.status === 'spinning')
      return res.status(400).json({ message: 'Already spinning' });

    const round = state.currentRound;
    if (round > 9) return res.status(400).json({ message: 'All rounds complete' });

    // Check already drawn this round
    const existing = await Winner.findOne({ roundNo: round });
    if (existing) return res.status(400).json({ message: 'Winner already drawn for this round' });

    const group = groupForRound(round);
    const { start, end } = getGroupRange(group, config.groupSize, config.totalCards);

    // Collect already-won numbers in this group
    const prevWinners = await Winner.find({ group });
    const wonNumbers  = new Set(prevWinners.map(w => w.winnerNumber));

    // Build available pool
    const pool = [];
    for (let n = start; n <= end; n++) {
      if (!wonNumbers.has(n)) pool.push(n);
    }
    if (pool.length === 0)
      return res.status(400).json({ message: 'No numbers left in this group' });

    const winnerNumber = pool[crypto.randomInt(0, pool.length)];

    // Get prize for this round
    const prize = await Prize.findOne({ roundNo: round });

    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { status: 'spinning' },
      { upsert: true }
    );

    io.emit('game:spin_start', { round, group, start, end });

    setTimeout(async () => {
      const winner = await Winner.create({
        roundNo: round, group, winnerNumber,
        prize: prize?._id || null,
      });

      await GameState.findOneAndUpdate(
        { singleton: 'state' },
        { status: 'revealed' }
      );

      io.emit('game:winner_revealed', {
        round, group, winnerNumber,
        prize: prize ? { name: prize.name, description: prize.description, imageUrl: prize.imageUrl } : null,
      });
    }, 6000);

    res.json({ message: 'Spinning started', winnerNumber, round });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /next-round
router.post('/next-round', auth, async (req, res) => {
  try {
    const io    = req.app.get('io');
    const state = await GameState.findOne({ singleton: 'state' });
    if (!state) return res.status(400).json({ message: 'No game state' });

    const nextRound = state.currentRound + 1;
    if (nextRound > 9) {
      await GameState.findOneAndUpdate({ singleton: 'state' }, { status: 'completed' });
      io.emit('game:completed');
      return res.json({ message: 'All rounds complete' });
    }

    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { currentRound: nextRound, status: 'idle' }
    );
    io.emit('game:next_round', { round: nextRound, group: groupForRound(nextRound) });
    res.json({ message: `Round ${nextRound} started` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /reset
router.post('/reset', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    await Winner.deleteMany({});
    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { currentRound: 1, status: 'idle', isActive: false },
      { upsert: true }
    );
    io.emit('game:reset');
    res.json({ message: 'Game reset' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /spin-again — redraw same round (previous winner was absent)
router.post('/spin-again', auth, async (req, res) => {
  try {
    const io     = req.app.get('io');
    const state  = await GameState.findOne({ singleton: 'state' });
    const config = await DrawConfig.findOne({ singleton: 'config' });

    if (!state || state.status !== 'revealed')
      return res.status(400).json({ message: 'Can only spin again after a winner is revealed' });

    const round  = state.currentRound;
    const group  = groupForRound(round);
    const { start, end } = getGroupRange(group, config.groupSize, config.totalCards);

    // Remove previous winner for this round so they are excluded
    await Winner.deleteOne({ roundNo: round });

    // Get all already-won numbers in this group (previous rounds only)
    const prevWinners = await Winner.find({ group });
    const wonNumbers  = new Set(prevWinners.map(w => w.winnerNumber));

    const pool = [];
    for (let n = start; n <= end; n++) {
      if (!wonNumbers.has(n)) pool.push(n);
    }
    if (pool.length === 0)
      return res.status(400).json({ message: 'No numbers left in this group' });

    const winnerNumber = pool[crypto.randomInt(0, pool.length)];
    const prize = await Prize.findOne({ roundNo: round });

    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { status: 'spinning' }
    );

    io.emit('game:spin_start', { round, group, start, end });

    setTimeout(async () => {
      await Winner.create({
        roundNo: round, group, winnerNumber,
        prize: prize?._id || null,
      });
      await GameState.findOneAndUpdate(
        { singleton: 'state' },
        { status: 'revealed' }
      );
      io.emit('game:winner_revealed', {
        round, group, winnerNumber,
        prize: prize ? { name: prize.name, description: prize.description, imageUrl: prize.imageUrl } : null,
      });
    }, 6000);

    res.json({ message: 'Spinning again...' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /state
router.get('/state', auth, async (req, res) => {
  try {
    const state   = await GameState.findOne({ singleton: 'state' });
    const config  = await DrawConfig.findOne({ singleton: 'config' });
    const winners = await Winner.find().populate('prize').sort({ roundNo: 1 });
    res.json({ state, config, winners });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
