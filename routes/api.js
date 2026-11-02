/**
 * Unified JSON REST API Routes
 * Serves both local browser interactions and remote frontend clients (Netlify in FULL DATABASE MODE).
 */
const router = require('express').Router();
const Book = require('../models/Book');
const Student = require('../models/Student');
const Loan = require('../models/Loan');
const Reservation = require('../models/Reservation');
const Fine = require('../models/Fine');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const ReturnRequest = require('../models/ReturnRequest');
const SystemSettings = require('../models/SystemSettings');
const Category = require('../models/Category');
const cache = require('../utils/cache');

// 1. Health & Config Status
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: 'full_database',
    timestamp: new Date().toISOString()
  });
});

// 2. System Settings
router.get('/settings', async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne({ settingKey: 'global_config' }).lean();
    if (!settings) {
      settings = await SystemSettings.create({
        settingKey: 'global_config',
        finePerDay: 5,
        dueSoonDays: 3,
        lowStockThreshold: 2
      });
    }
    res.json(settings);
  } catch (e) { next(e); }
});

// 3. Admin Dashboard KPIs & Priority Alerts
router.get('/admin/dashboard', async (req, res, next) => {
  try {
    const cachedStats = await cache.get('lms:dashboard:stats');
    if (cachedStats) {
      return res.json(cachedStats);
    }

    const now = new Date();
    const [
      totalStudents,
      totalTitles,
      copiesAgg,
      activeLoans,
      overdueLoans,
      pendingReservations,
      unpaidFinesAgg,
      collectedFinesAgg,
      lowStockBooks,
      overdueLoanRecords,
      returnRequestsCount
    ] = await Promise.all([
      Student.countDocuments(),
      Book.countDocuments(),
      Book.aggregate([{ $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }]),
      Loan.countDocuments({ status: { $in: ['Issued', 'Return Requested'] } }),
      Loan.countDocuments({ status: { $in: ['Issued', 'Return Requested'] }, dueAt: { $lt: now } }),
      Reservation.countDocuments({ status: 'Pending' }),
      Fine.aggregate([{ $match: { fineStatus: { $in: ['Unpaid', 'Partially Paid'] } } }, { $group: { _id: null, sum: { $sum: '$outstandingAmount' } } }]),
      Payment.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Book.find({ availableCopies: { $lte: 2 } }).limit(10).lean(),
      Loan.find({ status: { $in: ['Issued', 'Return Requested'] }, dueAt: { $lt: now } }).populate('book student').limit(10).lean(),
      ReturnRequest.countDocuments({ requestStatus: 'Pending' })
    ]);

    const stats = {
      totalStudents,
      totalTitles,
      totalCopies: copiesAgg[0]?.total || 0,
      availableCopies: copiesAgg[0]?.available || 0,
      activeLoans,
      overdueLoans,
      pendingReservations,
      returnRequestsCount,
      unpaidFines: unpaidFinesAgg[0]?.sum || 0,
      collectedFines: collectedFinesAgg[0]?.sum || 0,
      priorityAlerts: [
        ...overdueLoanRecords.map(l => ({
          type: 'overdue',
          priority: 'Critical',
          title: `Overdue Loan`,
          message: `"${l.book?.title || 'Book'}" issued to ${l.student?.name || 'Student'} is overdue.`
        })),
        ...lowStockBooks.map(b => ({
          type: 'stock',
          priority: b.availableCopies === 0 ? 'Critical' : 'High',
          title: b.availableCopies === 0 ? 'Out of Stock' : 'Low Stock Warning',
          message: `"${b.title}" has only ${b.availableCopies} available copies remaining.`
        }))
      ]
    };

    // Cache in Redis for 60 seconds
    await cache.set('lms:dashboard:stats', stats, 60);
    res.json(stats);
  } catch (e) { next(e); }
});

// 4. Analytics & Chart.js Data
router.get('/admin/analytics', async (req, res, next) => {
  try {
    const [monthlyLoans, categoryDistribution, finesByMonth, statusCounts, topBooks] = await Promise.all([
      // Monthly Borrowing Trend
      Loan.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$issuedDate' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ]),
      // Category Breakdown
      Book.aggregate([
        { $group: { _id: '$category', count: { $sum: '$totalCopies' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Fine Revenue
      Payment.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]),
      // Loan Statuses
      Loan.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Most Borrowed Books
      Loan.aggregate([
        { $group: { _id: '$book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookDetails' } }
      ])
    ]);

    res.json({
      monthlyLoans,
      categoryDistribution,
      finesByMonth,
      statusCounts,
      topBooks: topBooks.map(tb => ({
        title: tb.bookDetails[0]?.title || 'Unknown Title',
        count: tb.count
      }))
    });
  } catch (e) { next(e); }
});

// 5. Books CRUD
router.get('/books', async (req, res, next) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    const cat = req.query.category;
    const filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { isbn: { $regex: q, $options: 'i' } },
        { catalogCode: { $regex: q, $options: 'i' } }
      ];
    }
    if (cat && cat !== 'All') {
      filter.category = cat;
    }

    const books = await Book.find(filter).sort({ title: 1 }).limit(100).lean();
    res.json(books);
  } catch (e) { next(e); }
});

router.post('/admin/books', async (req, res, next) => {
  try {
    const total = Math.max(1, Number(req.body.totalCopies) || 3);
    const book = await Book.create({
      title: req.body.title,
      author: req.body.author,
      isbn: req.body.isbn,
      ISBN: req.body.isbn,
      category: req.body.category || 'General',
      shelfLocation: req.body.shelfLocation || 'Section A1',
      totalCopies: total,
      availableCopies: total,
      coverUrl: req.body.coverUrl,
      coverImage: req.body.coverUrl,
      description: req.body.description,
      publicationYear: Number(req.body.publicationYear) || new Date().getFullYear()
    });

    await cache.delPattern('lms:cache:book:*');
    await cache.del('lms:dashboard:stats');
    if (req.io) req.io.emit('admin:activity');

    res.status(201).json({ success: true, book });
  } catch (e) { next(e); }
});

// 6. One-Click Admin Book Import from Public API
router.post('/admin/books/import', async (req, res, next) => {
  try {
    const { title, author, isbn, category, coverUrl, description, totalCopies, shelfLocation, publicationYear } = req.body;
    if (!title || !author) {
      return res.status(400).json({ success: false, message: 'Title and author required.' });
    }

    const copies = Math.max(1, Number(totalCopies) || 4);
    const catalogCode = `BK-${Date.now().toString().slice(-4)}`;

    const newBook = await Book.create({
      catalogCode,
      bookId: catalogCode,
      title: title.trim(),
      author: author.trim(),
      ISBN: isbn || undefined,
      isbn: isbn || undefined,
      category: category || 'General',
      shelfLocation: shelfLocation || 'General Section A1',
      totalCopies: copies,
      availableCopies: copies,
      bookStatus: 'Available',
      coverImage: coverUrl,
      coverUrl,
      description: description || `Curated volume: ${title} by ${author}.`,
      publicationYear: Number(publicationYear) || new Date().getFullYear(),
      sourceProvider: 'Public API Import',
      demoRecord: false
    });

    await cache.delPattern('lms:cache:book:*');
    await cache.del('lms:dashboard:stats');
    if (req.io) req.io.emit('admin:activity');

    res.status(201).json({ success: true, book: newBook });
  } catch (e) { next(e); }
});

// 7. Student Directory
router.get('/students', async (req, res, next) => {
  try {
    const students = await Student.find().sort({ fullName: 1 }).lean();
    res.json(students);
  } catch (e) { next(e); }
});

// 8. Loans & Circulation API
router.get('/loans', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.status) filter.status = req.query.status;

    const loans = await Loan.find(filter).populate('book student').sort({ createdAt: -1 }).lean();
    res.json(loans);
  } catch (e) { next(e); }
});

// 9. Fines API
router.get('/fines', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.status) filter.fineStatus = req.query.status;

    const fines = await Fine.find(filter).populate('loan student').sort({ createdAt: -1 }).lean();
    res.json(fines);
  } catch (e) { next(e); }
});

module.exports = router;
