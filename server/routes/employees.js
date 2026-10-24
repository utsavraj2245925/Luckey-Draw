const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const GameState = require('../models/GameState');
const Winner = require('../models/Winner');

const upload = multer({ dest: 'uploads/' });

function assignGroup(serialNo, total) {
  const size = Math.ceil(total / 3);
  if (serialNo <= size) return 1;
  if (serialNo <= size * 2) return 2;
  return 3;
}

async function recomputeGroups() {
  const all = await Employee.find().sort({ serialNo: 1 });
  const total = all.length;
  const ops = all.map(e => ({
    updateOne: {
      filter: { _id: e._id },
      update: { $set: { group: assignGroup(e.serialNo, total) } },
    },
  }));
  if (ops.length) await Employee.bulkWrite(ops);
  const size = Math.ceil(total / 3);
  await GameState.findOneAndUpdate(
    { singleton: 'state' },
    { totalEmployees: total, groupSize: size },
    { upsert: true }
  );
  return { total, groupSize: size };
}

// Parse CSV manually — handles extra title rows before the real header
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const lines = fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .map(l => l.replace(/\r/g, '').trim())
      .filter(l => l.length > 0);

    // Find the header row — it must contain NAME OF EMPLOYEE or Name
    let headerIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const upper = lines[i].toUpperCase();
      if (upper.includes('NAME OF EMPLOYEE') || upper.includes('NAME')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return reject(new Error('Could not find header row in CSV'));

    const headers = lines[headerIdx].split(',').map(h => h.trim().toUpperCase());

    const results = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (!cols || cols.length < 2) continue;

      const get = (...keys) => {
        for (const k of keys) {
          const idx = headers.indexOf(k.toUpperCase());
          if (idx !== -1 && cols[idx]) return cols[idx].trim();
        }
        return '';
      };

      const name = get('NAME OF EMPLOYEE', 'NAME');
      if (!name) continue;

      results.push({
        name,
        payCode: get('PAY CODE', 'PAYCODE', 'PAY_CODE'),
        employeeId: get('EMPLOYEEID', 'EMPLOYEE ID', 'EMPID', 'PAY CODE', 'PAYCODE'),
        unit: get('UNIT'),
        gender: get('GENDER'),
        department: get('DEPARTMENT', 'DEPT'),
        designation: get('DESIGNATION'),
      });
    }
    resolve(results);
  });
}

// GET all employees
router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ serialNo: 1 });
    res.json(employees);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET summary
router.get('/summary', auth, async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    const g1 = await Employee.countDocuments({ group: 1 });
    const g2 = await Employee.countDocuments({ group: 2 });
    const g3 = await Employee.countDocuments({ group: 3 });
    res.json({ total, groups: { 1: g1, 2: g2, 3: g3 } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST bulk upload CSV
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const results = await parseCSV(req.file.path);
    fs.unlinkSync(req.file.path);

    if (results.length === 0)
      return res.status(400).json({ message: 'No employees found in CSV. Check file format.' });

    await Employee.deleteMany({});
    await Winner.deleteMany({});

    const total = results.length;
    const size = Math.ceil(total / 3);
    const docs = results.map((r, i) => ({
      ...r,
      serialNo: i + 1,
      group: assignGroup(i + 1, total),
      hasWon: false,
    }));

    await Employee.insertMany(docs);
    await GameState.findOneAndUpdate(
      { singleton: 'state' },
      { totalEmployees: total, groupSize: size, currentRound: 1, status: 'idle', isActive: false },
      { upsert: true, new: true }
    );
    res.json({ message: `${total} employees uploaded`, total, groupSize: size });
  } catch (e) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: e.message });
  }
});

// POST add single employee manually
router.post('/add', auth, async (req, res) => {
  try {
    const { name, payCode, employeeId, unit, gender, department, designation } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    const last = await Employee.findOne().sort({ serialNo: -1 });
    const serialNo = last ? last.serialNo + 1 : 1;
    const total = serialNo;
    const emp = await Employee.create({
      serialNo, name: name.trim(),
      payCode: payCode?.trim() || '',
      employeeId: employeeId?.trim() || payCode?.trim() || '',
      unit: unit?.trim() || '',
      gender: gender?.trim() || '',
      department: department?.trim() || '',
      designation: designation?.trim() || '',
      group: assignGroup(serialNo, total),
      hasWon: false,
    });
    const info = await recomputeGroups();
    res.json({ employee: emp, ...info });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE single employee
router.delete('/:id', auth, async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    const info = await recomputeGroups();
    res.json({ message: 'Deleted', ...info });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE all
router.delete('/all', auth, async (req, res) => {
  await Employee.deleteMany({});
  await Winner.deleteMany({});
  await GameState.findOneAndUpdate(
    { singleton: 'state' },
    { totalEmployees: 0, groupSize: 0, currentRound: 1, status: 'idle', isActive: false },
    { upsert: true }
  );
  res.json({ message: 'All employees cleared' });
});

module.exports = router;