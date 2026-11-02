const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  returnRequestId: { type: String, unique: true, sparse: true, trim: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  requestDate: { type: Date, default: Date.now },
  requestStatus: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Rejected'], 
    default: 'Pending' 
  },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  confirmedDate: { type: Date },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

returnRequestSchema.index({ loanId: 1 });
returnRequestSchema.index({ requestStatus: 1 });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
