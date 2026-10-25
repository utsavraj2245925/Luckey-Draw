const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    guestNumber: { type: String, required: true, unique: true, trim: true },
    won: { type: Boolean, default: false },
    wonRound: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Guest', guestSchema);