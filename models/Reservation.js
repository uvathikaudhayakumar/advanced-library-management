const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, unique: true, sparse: true, trim: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  reservationDate: { type: Date, default: Date.now },
  reservedAt: { type: Date, default: Date.now }, // backward-compatibility alias
  expiryDate: { type: Date },
  reservationStatus: { 
    type: String, 
    enum: ['Confirmed', 'Waiting', 'Fulfilled', 'Cancelled', 'Expired', 'Pending', 'Approved', 'Rejected'], 
    default: 'Confirmed' 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Issued', 'Expired'], 
    default: 'Pending' 
  },
  queuePosition: { type: Number, default: 1, min: 1 },
  fulfilledLoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  reviewedAt: { type: Date },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

reservationSchema.pre('save', function (next) {
  if (this.reservationDate && !this.reservedAt) this.reservedAt = this.reservationDate;
  if (this.reservedAt && !this.reservationDate) this.reservationDate = this.reservedAt;
  
  if (this.reservationStatus && !this.status) {
    if (this.reservationStatus === 'Confirmed') this.status = 'Approved';
    else if (this.reservationStatus === 'Waiting') this.status = 'Pending';
    else if (this.reservationStatus === 'Fulfilled') this.status = 'Issued';
    else this.status = this.reservationStatus;
  }
  next();
});

reservationSchema.index({ student: 1, book: 1, status: 1 });
reservationSchema.index({ bookId: 1, reservationStatus: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
