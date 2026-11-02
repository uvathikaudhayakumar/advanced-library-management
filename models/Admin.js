const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true, sparse: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: null },
  designation: { type: String, default: 'Library Administrator', trim: true },
  department: { type: String, default: 'Central Library', trim: true },
  role: { 
    type: String, 
    enum: ['Super Administrator', 'Library Administrator', 'Library Staff', 'admin'], 
    default: 'Library Administrator' 
  },
  accountStatus: { type: String, enum: ['Active', 'Suspended', 'Inactive'], default: 'Active' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
