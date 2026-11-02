const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, sparse: true, trim: true },
  registerNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: null },
  department: { type: String, required: true, trim: true },
  course: { type: String, default: 'Master of Computer Applications' },
  yearOfStudy: { type: Number, min: 1, max: 4, default: 1 },
  section: { type: String, default: 'A' },
  joinedDate: { type: Date, default: Date.now },
  accountStatus: { type: String, enum: ['Active', 'Suspended', 'Inactive'], default: 'Active' },
  role: { type: String, default: 'student' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Compound indexes for fast search and filtering
studentSchema.index({ department: 1, yearOfStudy: 1 });
studentSchema.index({ fullName: 'text', registerNumber: 'text', email: 'text' });

module.exports = mongoose.model('Student', studentSchema);
