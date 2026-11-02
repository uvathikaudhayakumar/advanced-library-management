const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, unique: true, sparse: true, trim: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notificationType: { 
    type: String, 
    enum: ['Issue', 'DueSoon', 'Overdue', 'ReservationApproval', 'ReservationRejection', 'Return', 'Fine', 'Payment', 'General'], 
    default: 'General' 
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  deliveryStatus: { 
    type: String, 
    enum: ['Delivered', 'Sent', 'Pending'], 
    default: 'Delivered' 
  },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ studentId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
