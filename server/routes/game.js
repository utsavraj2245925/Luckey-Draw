const router = require('express').Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const Prize = require('../models/Prize');
const Winner = require('../models/Winner');
const GameState = require('../models/GameState');

// Attach io to routes via app locals
const getIo = (req) => req.app.get('io');

// Which group is active for a given round?
// Rounds 1-3 → Group 1, 4-6 → Group 2, 7-9 → Group 3
function roundToGroup(round) {
  if (round <= 3) return 1;
  if (round <= 6) return 2;
  return 3;
}

// GET current game state + winners
router.get('/state', async (req, res) => {
  try {
    const state = await GameState.findOne({ singleton: 'state' });
    const winners = await Winner.find()
      .populate('employee', 'serialNo name department designation employeeId')
      .populate('prize', 'name description imageUrl')
      .sort({ roundNo: 1 });
    res.json({ state, winners });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST start game (set isActive = true)
router.post('/start', auth, async (req, res) => {
  try {
    const employees = await Employee.countDocuments();
    if (employees === 0) return res.status(400).json({ message: 'Upload employees first' });

    const state = await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { isActive: true, currentRound: 1, status: 'idle' },
      { upsert: true, new: true }
    );
    getIo(req).emit('game:state', { state, type: 'start' });
    res.json(state);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST spin — pick random winner for current round
router.post('/spin', auth, async (req, res) => {
  try {
    const state = await GameState.findOne({ singleton: 'state' });
    if (!state || !state.isActive) return res.status(400).json({ message: 'Game not started' });
    if (state.status === 'spinning') return res.status(400).json({ message: 'Already spinning' });
    if (state.currentRound > 9) return res.status(400).json({ message: 'All rounds completed' });

    const existingWinner = await Winner.findOne({ roundNo: state.currentRound });
    if (existingWinner) return res.status(400).json({ message: 'Round already has a winner' });

    const group = roundToGroup(state.currentRound);

    // Get eligible (not yet won) employees in this group
    const eligible = await Employee.find({ group, hasWon: false }).select('_id serialNo name department designation employeeId');
    if (eligible.length === 0) return res.status(400).json({ message: 'No eligible employees in this group' });

    // Crypto-secure random pick
    const idx = crypto.randomInt(0, eligible.length);
    const winner = eligible[idx];

    const prize = await Prize.findOne({ roundNo: state.currentRound });

    // Update state to spinning
    await GameState.findOneAndUpdate({ singleton: 'state' }, { status: 'spinning' });

    // Emit spin start to all live screens
    getIo(req).emit('game:spin_start', {
      roundNo: state.currentRound,
      group,
      winnerSerial: winner.serialNo,
      totalInGroup: eligible.length,
      allSerials: eligible.map(e => e.serialNo), // for drum animation
    });

    // After 6 seconds, save winner & emit reveal
    setTimeout(async () => {
      try {
        await Employee.findByIdAndUpdate(winner._id, { hasWon: true });
        const winnerDoc = await Winner.create({
          roundNo: state.currentRound,
          group,
          employee: winner._id,
          serialNo: winner.serialNo,
          prize: prize?._id,
        });
        await GameState.findOneAndUpdate({ singleton: 'state' }, { status: 'revealed' });

        getIo(req).emit('game:winner_revealed', {
          roundNo: state.currentRound,
          group,
          employee: {
            serialNo: winner.serialNo,
            name: winner.name,
            department: winner.department,
            designation: winner.designation,
            employeeId: winner.employeeId,
          },
          prize: prize ? { name: prize.name, description: prize.description, imageUrl: prize.imageUrl } : null,
        });
      } catch (err) {
        console.error('Winner save error:', err);
      }
    }, 6000);

    res.json({ message: 'Spin started', round: state.currentRound, group });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST next round
router.post('/next-round', auth, async (req, res) => {
  try {
    const state = await GameState.findOne({ singleton: 'state' });
    if (!state) return res.status(400).json({ message: 'Game not started' });
    if (state.currentRound >= 9) {
      await GameState.findOneAndUpdate({ singleton: 'state' }, { status: 'completed', isActive: false });
      getIo(req).emit('game:completed', { message: 'All 9 rounds completed!' });
      return res.json({ message: 'Game completed' });
    }
    const nextRound = state.currentRound + 1;
    await GameState.findOneAndUpdate({ singleton: 'state' }, { currentRound: nextRound, status: 'idle' });
    getIo(req).emit('game:next_round', { round: nextRound, group: roundToGroup(nextRound) });
    res.json({ currentRound: nextRound });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST reset game (but keep employees & prizes)
router.post('/reset', auth, async (req, res) => {
  try {
    await Winner.deleteMany({});
    await Employee.updateMany({}, { hasWon: false });
    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { currentRound: 1, status: 'idle', isActive: false },
      { upsert: true }
    );
    getIo(req).emit('game:reset');
    res.json({ message: 'Game reset' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET winners list
router.get('/winners', async (req, res) => {
  try {
    const winners = await Winner.find()
      .populate('employee', 'serialNo name department designation employeeId')
      .populate('prize', 'name description')
      .sort({ roundNo: 1 });
    res.json(winners);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
