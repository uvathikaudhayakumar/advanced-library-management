/**
 * Excel Import and Export Routes for Admin Portal
 * Utilizes SheetJS (xlsx) for multi-sheet workbook generation and validation.
 */
const router = require('express').Router();
const xlsx = require('xlsx');
const { requireAuth, requireRole } = require('../middleware/auth');

const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Loan = require('../models/Loan');
const Reservation = require('../models/Reservation');
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// Admin authentication required for Excel operations
router.use(requireAuth, requireRole('admin'));

// --- EXPORT ROUTES ---

// 1. Export Complete Dataset (Multi-sheet workbook)
router.get('/export/all', async (req, res, next) => {
  try {
    const [students, admins, books, categories, loans, reservations, fines, payments, notifications] = await Promise.all([
      Student.find().lean(),
      Admin.find().lean(),
      Book.find().lean(),
      Category.find().lean(),
      Loan.find().populate('book').lean(),
      Reservation.find().populate('book').lean(),
      Fine.find().lean(),
      Payment.find().lean(),
      Notification.find().lean()
    ]);

    const wb = xlsx.utils.book_new();

    // Students Sheet
    const studentRows = students.map(s => ({
      StudentID: s.studentId,
      RegisterNumber: s.registerNumber,
      FullName: s.fullName,
      Email: s.email,
      Department: s.department,
      Course: s.course,
      YearOfStudy: s.yearOfStudy,
      Section: s.section,
      Status: s.accountStatus,
      JoinedDate: s.joinedDate ? new Date(s.joinedDate).toISOString().split('T')[0] : ''
    }));
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(studentRows), 'Students');

    // Books Sheet
    const bookRows = books.map(b => ({
      CatalogCode: b.catalogCode || b.bookId,
      Title: b.title,
      Author: b.author,
      ISBN: b.ISBN || b.isbn || '',
      Category: b.category,
      ShelfLocation: b.shelfLocation || '',
      TotalCopies: b.totalCopies,
      AvailableCopies: b.availableCopies,
      Status: b.bookStatus,
      PublishedYear: b.publicationYear || ''
    }));
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(bookRows), 'Books');

    // Categories Sheet
    const catRows = categories.map(c => ({
      CategoryID: c.categoryId,
      CategoryName: c.categoryName,
      ShelfLocation: c.shelfLocation || '',
      Status: c.status
    }));
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(catRows), 'Categories');

    // Borrow Records Sheet
    const loanRows = loans.map(l => ({
      LoanID: l.loanId,
      StudentID: l.studentId,
      BookTitle: l.book?.title || '',
      CatalogCode: l.book?.catalogCode || '',
      IssuedDate: l.issuedDate ? new Date(l.issuedDate).toISOString().split('T')[0] : '',
      DueDate: l.dueDate ? new Date(l.dueDate).toISOString().split('T')[0] : '',
      ReturnDate: l.returnDate ? new Date(l.returnDate).toISOString().split('T')[0] : '',
      Status: l.loanStatus || l.status
    }));
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(loanRows), 'BorrowRecords');

    // Reservations Sheet
    const resRows = reservations.map(r => ({
      ReservationID: r.reservationId,
      StudentID: r.studentId,
      BookTitle: r.book?.title || '',
      ReservedDate: r.reservationDate ? new Date(r.reservationDate).toISOString().split('T')[0] : '',
      Status: r.reservationStatus || r.status,
      QueuePosition: r.queuePosition || 1
    }));
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(resRows), 'Reservations');

    // Fines Sheet
    const fineRows = fines.map(f => ({
      FineID: f.fineId,
      LoanID: f.loanId,
      OverdueDays: f.overdueDays,
      RatePerDay: f.ratePerDay,
      TotalAmount: f.fineAmount || f.amount,
      PaidAmount: f.paidAmount,
      OutstandingAmount: f.outstandingAmount,
      Status: f.fineStatus || f.status,
      PaymentRef: f.paymentReference || ''
    }));
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(fineRows), 'Fines');

    // Payments Sheet
    const pmtRows = payments.map(p => ({
      PaymentID: p.paymentId,
      FineID: p.fineId,
      Amount: p.amount,
      Method: p.paymentMethod,
      ReceiptRef: p.receiptReference,
      PaidDate: p.paidDate ? new Date(p.paidDate).toISOString().split('T')[0] : '',
      Status: p.paymentStatus
    }));
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(pmtRows), 'Payments');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="LibraryOS_Complete_Dataset.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// 2. Export Specific Collection
router.get('/export/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    let data = [];
    let filename = `LibraryOS_${type}.xlsx`;
    let sheetName = type.charAt(0).toUpperCase() + type.slice(1);

    if (type === 'students') {
      const records = await Student.find().lean();
      data = records.map(s => ({
        StudentID: s.studentId,
        RegisterNumber: s.registerNumber,
        FullName: s.fullName,
        Email: s.email,
        Department: s.department,
        Year: s.yearOfStudy,
        Section: s.section,
        Status: s.accountStatus
      }));
    } else if (type === 'books') {
      const records = await Book.find().lean();
      data = records.map(b => ({
        CatalogCode: b.catalogCode || b.bookId,
        Title: b.title,
        Author: b.author,
        ISBN: b.ISBN || b.isbn || '',
        Category: b.category,
        TotalCopies: b.totalCopies,
        AvailableCopies: b.availableCopies,
        Shelf: b.shelfLocation || '',
        Status: b.bookStatus
      }));
    } else if (type === 'fines') {
      const records = await Fine.find().lean();
      data = records.map(f => ({
        FineID: f.fineId,
        OverdueDays: f.overdueDays,
        FineAmount: f.fineAmount || f.amount,
        PaidAmount: f.paidAmount,
        OutstandingAmount: f.outstandingAmount,
        Status: f.fineStatus || f.status,
        ReceiptReference: f.paymentReference || ''
      }));
    } else {
      return res.status(400).send('Invalid export collection type.');
    }

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(data), sheetName);
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// --- IMPORT ROUTE ---
router.post('/import', async (req, res, next) => {
  try {
    // Check if buffer exists in request body or multer
    if (!req.body && !req.files) {
      return res.status(400).json({ success: false, message: 'No file data provided.' });
    }

    // Handle base64 payload from client fetch or direct buffer
    let buffer;
    if (req.body.base64Data) {
      buffer = Buffer.from(req.body.base64Data.split(',')[1] || req.body.base64Data, 'base64');
    } else if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid file format. Upload .xlsx workbook.' });
    }

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const report = {
      success: true,
      sheetsProcessed: [],
      recordsInserted: 0,
      recordsSkipped: 0,
      errors: []
    };

    // 1. Process Students Worksheet
    if (workbook.SheetNames.includes('Students')) {
      const sheet = workbook.Sheets['Students'];
      const rows = xlsx.utils.sheet_to_json(sheet);
      report.sheetsProcessed.push('Students');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.RegisterNumber || !row.FullName || !row.Email) {
          report.recordsSkipped++;
          report.errors.push(`Row ${i + 2} in Students skipped: Missing required RegisterNumber, FullName, or Email.`);
          continue;
        }

        try {
          const regNo = String(row.RegisterNumber).trim().toUpperCase();
          const email = String(row.Email).trim().toLowerCase();
          
          await Student.findOneAndUpdate(
            { registerNumber: regNo },
            {
              studentId: row.StudentID || `STU-${Date.now().toString().slice(-4)}`,
              registerNumber: regNo,
              fullName: String(row.FullName).trim(),
              email,
              department: row.Department || 'Computer Science',
              yearOfStudy: Number(row.YearOfStudy || row.Year) || 1,
              section: row.Section || 'A',
              accountStatus: row.Status || 'Active'
            },
            { upsert: true }
          );
          report.recordsInserted++;
        } catch (e) {
          report.recordsSkipped++;
          report.errors.push(`Row ${i + 2} error: ${e.message}`);
        }
      }
    }

    // 2. Process Books Worksheet
    if (workbook.SheetNames.includes('Books')) {
      const sheet = workbook.Sheets['Books'];
      const rows = xlsx.utils.sheet_to_json(sheet);
      report.sheetsProcessed.push('Books');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.Title || !row.Author) {
          report.recordsSkipped++;
          report.errors.push(`Row ${i + 2} in Books skipped: Missing required Title or Author.`);
          continue;
        }

        try {
          const catalogCode = row.CatalogCode || `BK-${Date.now().toString().slice(-4)}`;
          const total = Math.max(1, Number(row.TotalCopies) || 3);
          const available = Math.min(total, Number(row.AvailableCopies) || total);

          await Book.findOneAndUpdate(
            { catalogCode },
            {
              bookId: catalogCode,
              catalogCode,
              title: String(row.Title).trim(),
              author: String(row.Author).trim(),
              ISBN: row.ISBN ? String(row.ISBN).trim() : undefined,
              isbn: row.ISBN ? String(row.ISBN).trim() : undefined,
              category: row.Category || 'General',
              shelfLocation: row.ShelfLocation || row.Shelf || 'Section A1',
              totalCopies: total,
              availableCopies: available,
              bookStatus: available === 0 ? 'Out of Stock' : 'Available',
              publicationYear: Number(row.PublishedYear) || undefined
            },
            { upsert: true }
          );
          report.recordsInserted++;
        } catch (e) {
          report.recordsSkipped++;
          report.errors.push(`Row ${i + 2} in Books error: ${e.message}`);
        }
      }
    }

    return res.json(report);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to parse Excel workbook: ' + err.message });
  }
});

module.exports = router;
