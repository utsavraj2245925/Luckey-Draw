const mongoose = require('mongoose');
const drawConfigSchema = new mongoose.Schema({
  singleton:  { type: String, default: 'config', unique: true },
  totalCards: { type: Number, default: 0 },
  groupSize:  { type: Number, default: 0 },
});
module.exports = mongoose.model('DrawConfig', drawConfigSchema);
