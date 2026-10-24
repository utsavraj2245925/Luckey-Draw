const mongoose = require('mongoose');
const winnerSchema = new mongoose.Schema({
  roundNo:      { type: Number, required: true, unique: true },
  group:        { type: Number, enum: [1,2,3], required: true },
  winnerNumber: { type: Number, required: true },
  prize:        { type: mongoose.Schema.Types.ObjectId, ref: 'Prize' },
  drawnAt:      { type: Date, default: Date.now },
});
module.exports = mongoose.model('Winner', winnerSchema);
