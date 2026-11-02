const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  registrationNo: { type: String, unique: true, sparse: true, trim: true },
  department: { type: String, trim: true },
  year: { type: String, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student', 'superadmin'], required: true },
  active: { type: Boolean, default: true },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
