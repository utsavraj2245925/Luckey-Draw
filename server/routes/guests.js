const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const crypto = require('crypto');
const Guest = require('../models/Guest');
// ASSUMPTION: your JWT middleware lives here and is exported directly.
// If it's `const { auth } = require(...)` or a different path, change this line.
const auth = require('../middleware/auth');

const MAX_ROUNDS = 3;
const SPIN_MS = 6000;
let spinning = false;

const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
const pick = (row, candidates) => {
  const map = {};
  Object.keys(row).forEach((k) => (map[norm(k)] = row[k]));
  for (const c of candidates) {
    if (map[c] !== undefined && String(map[c]).trim() !== '') return String(map[c]).trim();
  }
  return '';
};

module.exports = (io) => {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

  const publicGuest = (g) => ({
    _id: g._id,
    name: g.name,
    guestNumber: g.guestNumber,
    won: g.won,
    wonRound: g.wonRound,
  });

  const getState = async () => {
    const winners = await Guest.find({ won: true }).sort({ wonRound: 1 });
    return {
      maxRounds: MAX_ROUNDS,
      roundsDone: winners.length,
      winners: winners.map(publicGuest),
      spinning,
      total: await Guest.countDocuments(),
    };
  };

  // Public: all guests (for cards)
  router.get('/', async (req, res) => {
    const guests = await Guest.find();
    guests.sort((a, b) => a.guestNumber.localeCompare(b.guestNumber, undefined, { numeric: true }));
    res.json(guests.map(publicGuest));
  });

  // Public: draw state
  router.get('/state', async (req, res) => res.json(await getState()));

  // Admin: upload guest sheet (replaces existing guests)
  router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      if (spinning) return res.status(409).json({ message: 'A spin is in progress' });

      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

      const guests = [];
      const seen = new Set();
      const errors = [];

      rows.forEach((row, i) => {
        const name = pick(row, ['name', 'guestname', 'guest']);
        const guestNumber = pick(row, ['number', 'guestnumber', 'luckynumber', 'no', 'code', 'id', 'token']);
        if (!name && !guestNumber) return; // blank row
        if (!name || !guestNumber) return errors.push(`Row ${i + 2}: name or number missing`);
        if (seen.has(guestNumber)) return errors.push(`Row ${i + 2}: duplicate number ${guestNumber}`);
        seen.add(guestNumber);
        guests.push({ name, guestNumber });
      });

      if (errors.length) return res.status(400).json({ message: 'Sheet has errors', errors: errors.slice(0, 20) });
      if (!guests.length) return res.status(400).json({ message: 'No guests found in sheet' });

      await Guest.deleteMany({});
      await Guest.insertMany(guests);
      io.emit('guest:updated');
      res.json({ ok: true, count: guests.length });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to read sheet' });
    }
  });

  // Admin: spin (one round)
  router.post('/spin', auth, async (req, res) => {
    try {
      if (spinning) return res.status(409).json({ message: 'Already spinning' });

      const roundsDone = await Guest.countDocuments({ won: true });
      if (roundsDone >= MAX_ROUNDS) return res.status(400).json({ message: 'All 3 rounds are complete' });

      const pool = await Guest.find({ won: false });
      if (!pool.length) return res.status(400).json({ message: 'No guests available' });

      const winner = pool[crypto.randomInt(pool.length)];
      const round = roundsDone + 1;

      spinning = true;
      io.emit('guest:spinStart', { round, duration: SPIN_MS });
      res.json({ ok: true, round });

      setTimeout(async () => {
        try {
          winner.won = true;
          winner.wonRound = round;
          await winner.save();
          io.emit('guest:winner', { round, winner: publicGuest(winner) });
        } catch (e) {
          console.error(e);
        } finally {
          spinning = false;
        }
      }, SPIN_MS);
    } catch (e) {
      console.error(e);
      spinning = false;
      res.status(500).json({ message: 'Spin failed' });
    }
  });

  // Admin: reset winners (keeps guests)
  router.post('/reset', auth, async (req, res) => {
    if (spinning) return res.status(409).json({ message: 'A spin is in progress' });
    await Guest.updateMany({}, { won: false, wonRound: null });
    io.emit('guest:reset');
    res.json({ ok: true });
  });

  return router;
};