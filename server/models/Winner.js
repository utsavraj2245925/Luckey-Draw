const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  roundNo: { type: Number, required: true },
  group: { type: Number, required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  serialNo: { type: Number, required: true },
  prize: { type: mongoose.Schema.Types.ObjectId, ref: 'Prize' },
  drawnAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Winner', winnerSchema);
