const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  fineId: { type: String, unique: true, sparse: true, trim: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  calculatedDate: { type: Date, default: Date.now },
  overdueDays: { type: Number, default: 0, min: 0 },
  ratePerDay: { type: Number, default: 5, min: 0 },
  fineAmount: { type: Number, required: true, min: 0 },
  amount: { type: Number, min: 0 }, // backward-compatibility alias
  paidAmount: { type: Number, default: 0, min: 0 },
  outstandingAmount: { type: Number, default: 0, min: 0 },
  fineStatus: { 
    type: String, 
    enum: ['Unpaid', 'Paid', 'Partially Paid', 'Waived'], 
    default: 'Unpaid' 
  },
  status: { 
    type: String, 
    enum: ['Unpaid', 'Paid', 'Partially Paid', 'Waived'], 
    default: 'Unpaid' 
  },
  paidAt: { type: Date },
  paymentReference: { type: String, trim: true },
  waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  waiverReason: { type: String, trim: true },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

fineSchema.pre('save', function (next) {
  if (this.fineAmount !== undefined && this.amount === undefined) this.amount = this.fineAmount;
  if (this.amount !== undefined && this.fineAmount === undefined) this.fineAmount = this.amount;
  
  if (this.paidAmount === undefined) this.paidAmount = 0;
  this.outstandingAmount = Math.max(0, (this.fineAmount || 0) - this.paidAmount);

  if (this.fineStatus === 'Waived') {
    this.status = 'Waived';
    this.outstandingAmount = 0;
  } else if (this.outstandingAmount === 0 && this.fineAmount > 0) {
    this.fineStatus = 'Paid';
    this.status = 'Paid';
  } else if (this.paidAmount > 0 && this.outstandingAmount > 0) {
    this.fineStatus = 'Partially Paid';
    this.status = 'Partially Paid';
  } else {
    this.fineStatus = 'Unpaid';
    this.status = 'Unpaid';
  }
  next();
});

fineSchema.index({ loan: 1 }, { unique: true });
fineSchema.index({ student: 1, fineStatus: 1 });

module.exports = mongoose.model('Fine', fineSchema);
