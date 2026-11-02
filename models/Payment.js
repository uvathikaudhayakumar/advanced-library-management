const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, sparse: true, trim: true },
  fineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fine', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Demo Portal'], 
    default: 'Cash' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Confirmed', 'Pending', 'Failed'], 
    default: 'Confirmed' 
  },
  paidDate: { type: Date, default: Date.now },
  receiptReference: { type: String, required: true, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

paymentSchema.index({ fineId: 1 });
paymentSchema.index({ receiptReference: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
