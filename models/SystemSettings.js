const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  settingKey: { type: String, default: 'global_config', unique: true },
  libraryName: { type: String, default: 'Central Library Management System' },
  finePerDay: { type: Number, default: 5, min: 0 },
  dueSoonDays: { type: Number, default: 3, min: 1 },
  lowStockThreshold: { type: Number, default: 2, min: 0 },
  maxReservationsPerStudent: { type: Number, default: 3, min: 1 },
  maxLoanDays: { type: Number, default: 14, min: 1 },
  maxRenewals: { type: Number, default: 2, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
