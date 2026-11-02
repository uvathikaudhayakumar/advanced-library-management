/**
 * Development-Only Demo Data Cleanup Script
 * Safely removes records marked demoRecord: true.
 * Strictly blocked in production environments.
 */
require('dotenv').config();
const mongoose = require('mongoose');

if (process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: Demo cleanup is strictly prohibited in production environment.');
  process.exit(1);
}

const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const Reservation = require('../models/Reservation');
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const ReturnRequest = require('../models/ReturnRequest');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/advanced_library';

async function cleanup() {
  console.log('Connecting to database for demo record cleanup...');
  await mongoose.connect(MONGODB_URI);

  const filter = { demoRecord: true };

  const [
    delCategories,
    delStudents,
    delAdmins,
    delBooks,
    delLoans,
    delReservations,
    delFines,
    delPayments,
    delNotifications,
    delReturns,
    delUsers
  ] = await Promise.all([
    Category.deleteMany(filter),
    Student.deleteMany(filter),
    Admin.deleteMany(filter),
    Book.deleteMany(filter),
    Loan.deleteMany(filter),
    Reservation.deleteMany(filter),
    Fine.deleteMany(filter),
    Payment.deleteMany(filter),
    Notification.deleteMany(filter),
    ReturnRequest.deleteMany(filter),
    User.deleteMany(filter)
  ]);

  console.log('--- DEMO RECORDS REMOVED ---');
  console.log(`Categories:      ${delCategories.deletedCount}`);
  console.log(`Students:        ${delStudents.deletedCount}`);
  console.log(`Admins:          ${delAdmins.deletedCount}`);
  console.log(`Books:           ${delBooks.deletedCount}`);
  console.log(`Loans:           ${delLoans.deletedCount}`);
  console.log(`Reservations:    ${delReservations.deletedCount}`);
  console.log(`Fines:           ${delFines.deletedCount}`);
  console.log(`Payments:        ${delPayments.deletedCount}`);
  console.log(`Notifications:   ${delNotifications.deletedCount}`);
  console.log(`Return Requests: ${delReturns.deletedCount}`);
  console.log(`Users:           ${delUsers.deletedCount}`);
  console.log('\nDemo cleanup complete. Real database records preserved.');

  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
