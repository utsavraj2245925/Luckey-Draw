const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  serialNo: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  payCode: { type: String, trim: true, default: '' },
  employeeId: { type: String, trim: true, default: '' },
  unit: { type: String, trim: true, default: '' },
  gender: { type: String, trim: true, default: '' },
  department: { type: String, trim: true, default: '' },
  designation: { type: String, trim: true, default: '' },
  group: { type: Number, enum: [1, 2, 3] },
  hasWon: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);