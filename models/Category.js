const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryId: { type: String, unique: true, sparse: true, trim: true },
  categoryName: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  shelfLocation: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
