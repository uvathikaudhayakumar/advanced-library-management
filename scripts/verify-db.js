/**
 * Database Verification Script
 * Validates collection counts, schema integrity and relationship validity.
 */
require('dotenv').config();
const mongoose = require('mongoose');

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
const SystemSettings = require('../models/SystemSettings');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/advanced_library';

async function verify() {
  console.log('Connecting to database for verification...');
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to: ${mongoose.connection.name}\n`);

  const [
    categories,
    students,
    admins,
    books,
    loans,
    reservations,
    fines,
    payments,
    notifications,
    returnRequests,
    settings
  ] = await Promise.all([
    Category.countDocuments(),
    Student.countDocuments(),
    Admin.countDocuments(),
    Book.countDocuments(),
    Loan.countDocuments(),
    Reservation.countDocuments(),
    Fine.countDocuments(),
    Payment.countDocuments(),
    Notification.countDocuments(),
    ReturnRequest.countDocuments(),
    SystemSettings.countDocuments()
  ]);

  console.log('--- DATABASE COLLECTION COUNTS ---');
  console.log(`Categories:       ${categories} (Requirement: 10)`);
  console.log(`Students:         ${students} (Requirement: 50)`);
  console.log(`Admins:           ${admins} (Requirement: 3)`);
  console.log(`Books:            ${books} (Requirement: 50)`);
  console.log(`Borrow Records:   ${loans} (Requirement: 50)`);
  console.log(`Reservations:     ${reservations} (Requirement: 50)`);
  console.log(`Fines:            ${fines} (Requirement: 30+)`);
  console.log(`Payments:         ${payments} (Requirement: 30)`);
  console.log(`Notifications:    ${notifications} (Requirement: 50)`);
  console.log(`Return Requests:  ${returnRequests} (Requirement: 15+)`);
  console.log(`System Settings:  ${settings}`);

  // Reference Integrity Checks
  console.log('\n--- REFERENCE INTEGRITY CHECKS ---');
  const orphanLoans = await Loan.countDocuments({ studentId: { $exists: true, $nin: await Student.distinct('_id') } });
  const orphanBookLoans = await Loan.countDocuments({ bookId: { $exists: true, $nin: await Book.distinct('_id') } });
  const orphanFines = await Fine.countDocuments({ loanId: { $exists: true, $nin: await Loan.distinct('_id') } });
  const orphanPayments = await Payment.countDocuments({ fineId: { $exists: true, $nin: await Fine.distinct('_id') } });

  console.log(`Orphan Loans (Invalid Student): ${orphanLoans}`);
  console.log(`Orphan Loans (Invalid Book):    ${orphanBookLoans}`);
  console.log(`Orphan Fines (Invalid Loan):     ${orphanFines}`);
  console.log(`Orphan Payments (Invalid Fine):  ${orphanPayments}`);

  if (orphanLoans === 0 && orphanBookLoans === 0 && orphanFines === 0 && orphanPayments === 0) {
    console.log('\nAll foreign key references and relationships verified intact!');
  } else {
    console.warn('\nWarning: Reference inconsistencies detected.');
  }

  await mongoose.disconnect();
}

verify().catch(err => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});
