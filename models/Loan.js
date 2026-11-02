const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: { type: String, unique: true, sparse: true, trim: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // backward-compatibility
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  issuedDate: { type: Date, default: Date.now },
  issuedAt: { type: Date, default: Date.now }, // backward-compatibility alias
  dueDate: { type: Date, required: true },
  dueAt: { type: Date }, // backward-compatibility alias
  returnDate: { type: Date },
  returnedAt: { type: Date }, // backward-compatibility alias
  loanStatus: { 
    type: String, 
    enum: ['Issued', 'Return Requested', 'Returned', 'Overdue'], 
    default: 'Issued' 
  },
  status: { 
    type: String, 
    enum: ['Issued', 'Return Requested', 'Returned'], 
    default: 'Issued' 
  },
  renewalCount: { type: Number, default: 0, min: 0 },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  returnReceivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

loanSchema.pre('save', function (next) {
  if (this.issuedDate && !this.issuedAt) this.issuedAt = this.issuedDate;
  if (this.issuedAt && !this.issuedDate) this.issuedDate = this.issuedAt;
  if (this.dueDate && !this.dueAt) this.dueAt = this.dueDate;
  if (this.dueAt && !this.dueDate) this.dueDate = this.dueAt;
  if (this.returnDate && !this.returnedAt) this.returnedAt = this.returnDate;
  if (this.returnedAt && !this.returnDate) this.returnDate = this.returnedAt;
  if (this.status && !this.loanStatus) this.loanStatus = this.status;
  if (this.loanStatus && !this.status) {
    this.status = this.loanStatus === 'Overdue' ? 'Issued' : this.loanStatus;
  }
  next();
});

loanSchema.index({ student: 1, loanStatus: 1 });
loanSchema.index({ book: 1, loanStatus: 1 });
loanSchema.index({ dueDate: 1 });

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan;
