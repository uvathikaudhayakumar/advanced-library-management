/**
 * Automatic Demo Dataset Generator
 * Generates 50+ Students, 50 Books, 10 Categories, 3 Admins, 50 Reservations,
 * 50 Borrow Records, 30+ Fines, 30 Payments, 50 Notifications, and 15+ Return Requests.
 * All records are tagged with demoRecord: true.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/advanced_library';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected successfully.');
  console.log('\nDemo dataset generation started.\n');

  // 1. System Settings
  await SystemSettings.findOneAndUpdate(
    { settingKey: 'global_config' },
    {
      settingKey: 'global_config',
      libraryName: 'Central Academic Library Management System',
      finePerDay: Number(process.env.FINE_PER_DAY) || 5,
      dueSoonDays: Number(process.env.DUE_SOON_DAYS) || 3,
      lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD) || 2,
      maxReservationsPerStudent: 3,
      maxLoanDays: 14,
      maxRenewals: 2
    },
    { upsert: true, new: true }
  );

  // 2. Insert 10 Categories
  const categoryData = [
    { categoryId: 'CAT-01', categoryName: 'Computer Science', shelfLocation: 'Section A1 - Row 1', description: 'Core computing theory, algorithms, architecture and systems programming.' },
    { categoryId: 'CAT-02', categoryName: 'Software Engineering', shelfLocation: 'Section A1 - Row 2', description: 'Design patterns, software lifecycle, agile craftsmanship and architecture.' },
    { categoryId: 'CAT-03', categoryName: 'Artificial Intelligence', shelfLocation: 'Section A2 - Row 1', description: 'Intelligent systems, search heuristics, NLP, robotics and knowledge representation.' },
    { categoryId: 'CAT-04', categoryName: 'Machine Learning', shelfLocation: 'Section A2 - Row 2', description: 'Deep learning, statistical learning, neural networks and reinforcement learning.' },
    { categoryId: 'CAT-05', categoryName: 'Data Science', shelfLocation: 'Section B1 - Row 1', description: 'Data wrangling, big data analytics, visualization and statistical modeling.' },
    { categoryId: 'CAT-06', categoryName: 'Database Management', shelfLocation: 'Section B1 - Row 2', description: 'Relational databases, SQL, NoSQL, query optimization and storage engines.' },
    { categoryId: 'CAT-07', categoryName: 'Cloud Computing', shelfLocation: 'Section B2 - Row 1', description: 'Distributed computing, microservices, Kubernetes, cloud security and DevOps.' },
    { categoryId: 'CAT-08', categoryName: 'Cybersecurity', shelfLocation: 'Section B2 - Row 2', description: 'Cryptography, network defense, penetration testing and ethical hacking.' },
    { categoryId: 'CAT-09', categoryName: 'Mathematics', shelfLocation: 'Section C1 - Row 1', description: 'Discrete mathematics, linear algebra, calculus, probability and graph theory.' },
    { categoryId: 'CAT-10', categoryName: 'Literature', shelfLocation: 'Section D1 - Row 1', description: 'Classic literature, technical communication, world novels and rhetoric.' }
  ];

  const categories = [];
  for (const c of categoryData) {
    const doc = await Category.findOneAndUpdate(
      { categoryName: c.categoryName },
      { ...c, demoRecord: true, status: 'Active' },
      { upsert: true, new: true }
    );
    categories.push(doc);
  }

  // 3. Insert 3 Admin Profiles
  const defaultPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10);
  
  const adminData = [
    {
      adminId: 'ADM-001',
      fullName: 'Dr. Rajesh Ramanathan',
      email: (process.env.SUPERADMIN_EMAIL || 'superadmin@library.local').toLowerCase(),
      phone: '+91 98765 43210',
      designation: 'Chief University Librarian',
      department: 'Central Academic Library',
      role: 'Super Administrator'
    },
    {
      adminId: 'ADM-002',
      fullName: process.env.ADMIN_NAME || 'Library Administrator',
      email: (process.env.ADMIN_EMAIL || 'admin@library.local').toLowerCase(),
      phone: '+91 98765 43211',
      designation: 'Head of Library Operations',
      department: 'Central Academic Library',
      role: 'Library Administrator'
    },
    {
      adminId: 'ADM-003',
      fullName: 'Pooja Deshmukh',
      email: 'staff@library.local',
      phone: '+91 98765 43212',
      designation: 'Senior Circulation Desk Officer',
      department: 'Circulation & Services',
      role: 'Library Staff'
    }
  ];

  const admins = [];
  for (const a of adminData) {
    const userDoc = await User.findOneAndUpdate(
      { email: a.email },
      {
        name: a.fullName,
        email: a.email,
        passwordHash: defaultPasswordHash,
        role: 'admin',
        active: true,
        demoRecord: true
      },
      { upsert: true, new: true }
    );

    const doc = await Admin.findOneAndUpdate(
      { email: a.email },
      { ...a, user: userDoc._id, demoRecord: true, accountStatus: 'Active' },
      { upsert: true, new: true }
    );
    admins.push(doc);
  }

  // 4. Generate 50 Students
  const departments = [
    'Computer Science', 'Information Technology', 'Artificial Intelligence',
    'Data Science', 'Electronics and Communication', 'Electrical Engineering',
    'Mechanical Engineering', 'Civil Engineering'
  ];
  const courses = ['MCA', 'B.Tech', 'M.Tech', 'M.Sc Data Science'];

  const studentFirstNames = [
    'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Bhavna', 'Chetan', 'Deepika', 'Dev', 'Diya',
    'Gaurav', 'Harini', 'Ishaan', 'Janani', 'Karthik', 'Kavya', 'Madhav', 'Meera', 'Naveen', 'Neha',
    'Nikhil', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Rhea', 'Rohan', 'Roshni', 'Sahil', 'Sakshi',
    'Sameer', 'Sanjana', 'Siddharth', 'Simran', 'Sneha', 'Suresh', 'Tanvi', 'Tarun', 'Trisha', 'Utkarsh',
    'Uvathika', 'Vaishnavi', 'Varun', 'Vidya', 'Vikram', 'Vinay', 'Yash', 'Zara', 'Abhinav', 'Anjali'
  ];

  const studentLastNames = [
    'Sharma', 'Verma', 'Patel', 'Iyer', 'Reddy', 'Nair', 'Kulkarni', 'Deshmukh', 'Menon', 'Gupta',
    'Mehta', 'Rao', 'Bhat', 'Chopra', 'Kapoor', 'Singh', 'Sen', 'Pillai', 'Kumar', 'Sundaram'
  ];

  const students = [];
  for (let i = 1; i <= 50; i++) {
    const fn = studentFirstNames[i - 1] || `Student${i}`;
    const ln = studentLastNames[(i * 3) % studentLastNames.length];
    const fullName = `${fn} ${ln}`;
    const regNo = `24MCA${String(i).padStart(3, '0')}`;
    const email = i === 1 ? 'uvathika.u2024@vitstudent.ac.in' : `student${String(i).padStart(2, '0')}@library.local`;
    const dept = departments[i % departments.length];
    const crse = courses[i % courses.length];
    const yr = (i % 4) + 1;
    const sec = ['A', 'B', 'C'][i % 3];
    const joinedYear = 2026 - yr + 1;
    const joinedDate = new Date(`${joinedYear}-08-01T09:00:00Z`);

    // Create user login credential for first 2 students to allow interactive login
    let userDoc = null;
    if (i <= 2) {
      userDoc = await User.findOneAndUpdate(
        { email },
        {
          name: fullName,
          email,
          registrationNo: regNo,
          department: dept,
          year: `${yr}st Year`,
          passwordHash: defaultPasswordHash,
          role: 'student',
          active: true,
          demoRecord: true
        },
        { upsert: true, new: true }
      );
    }

    const doc = await Student.findOneAndUpdate(
      { registerNumber: regNo },
      {
        studentId: `STU-${String(i).padStart(3, '0')}`,
        registerNumber: regNo,
        fullName,
        email,
        phone: `+91 91234 ${String(50000 + i)}`,
        department: dept,
        course: crse,
        yearOfStudy: yr,
        section: sec,
        joinedDate,
        accountStatus: i === 49 ? 'Suspended' : i === 50 ? 'Inactive' : 'Active',
        role: 'student',
        user: userDoc?._id,
        demoRecord: true
      },
      { upsert: true, new: true }
    );
    students.push(doc);
  }

  // 5. Generate 50 Books (5 per each of the 10 categories)
  const bookCatalogData = [
    // 1. Computer Science
    { title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest', isbn: '9780262033848', cat: 'Computer Science', year: 2009, shelf: 'CS-101', copies: 6 },
    { title: 'Computer Systems: A Programmer\'s Perspective', author: 'Randal E. Bryant, David R. O\'Hallaron', isbn: '9780134092669', cat: 'Computer Science', year: 2015, shelf: 'CS-102', copies: 5 },
    { title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson, Gerald Jay Sussman', isbn: '9780262510875', cat: 'Computer Science', year: 1996, shelf: 'CS-103', copies: 4 },
    { title: 'Operating System Concepts', author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', isbn: '9781119800361', cat: 'Computer Science', year: 2018, shelf: 'CS-104', copies: 6 },
    { title: 'Computer Networks: A Systems Approach', author: 'Larry L. Peterson, Bruce S. Davie', isbn: '9780123850591', cat: 'Computer Science', year: 2011, shelf: 'CS-105', copies: 5 },

    // 2. Software Engineering
    { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '9780132350884', cat: 'Software Engineering', year: 2008, shelf: 'SE-201', copies: 6 },
    { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', isbn: '9780201633610', cat: 'Software Engineering', year: 1994, shelf: 'SE-202', copies: 5 },
    { title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', isbn: '9780134757599', cat: 'Software Engineering', year: 2018, shelf: 'SE-203', copies: 5 },
    { title: 'The Pragmatic Programmer: Your Journey To Mastery', author: 'David Thomas, Andrew Hunt', isbn: '9780135957059', cat: 'Software Engineering', year: 2019, shelf: 'SE-204', copies: 5 },
    { title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software', author: 'Eric Evans', isbn: '9780321125217', cat: 'Software Engineering', year: 2003, shelf: 'SE-205', copies: 4 },

    // 3. Artificial Intelligence
    { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', isbn: '9780136042594', cat: 'Artificial Intelligence', year: 2020, shelf: 'AI-301', copies: 6 },
    { title: 'Reinforcement Learning: An Introduction', author: 'Richard S. Sutton, Andrew G. Barto', isbn: '9780262039246', cat: 'Artificial Intelligence', year: 2018, shelf: 'AI-302', copies: 4 },
    { title: 'Artificial Intelligence: Foundations of Computational Agents', author: 'David L. Poole, Alan K. Mackworth', isbn: '9781107195394', cat: 'Artificial Intelligence', year: 2017, shelf: 'AI-303', copies: 4 },
    { title: 'Planning Algorithms', author: 'Steven M. LaValle', isbn: '9780521862059', cat: 'Artificial Intelligence', year: 2006, shelf: 'AI-304', copies: 3 },
    { title: 'Probabilistic Graphical Models: Principles and Techniques', author: 'Daphne Koller, Nir Friedman', isbn: '9780262013192', cat: 'Artificial Intelligence', year: 2009, shelf: 'AI-305', copies: 4 },

    // 4. Machine Learning
    { title: 'Pattern Recognition and Machine Learning', author: 'Christopher M. Bishop', isbn: '9780387310732', cat: 'Machine Learning', year: 2006, shelf: 'ML-401', copies: 5 },
    { title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', isbn: '9780262035613', cat: 'Machine Learning', year: 2016, shelf: 'ML-402', copies: 6 },
    { title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', author: 'Aurélien Géron', isbn: '9781492032649', cat: 'Machine Learning', year: 2019, shelf: 'ML-403', copies: 5 },
    { title: 'Machine Learning: A Probabilistic Perspective', author: 'Kevin P. Murphy', isbn: '9780262018029', cat: 'Machine Learning', year: 2012, shelf: 'ML-404', copies: 4 },
    { title: 'The Elements of Statistical Learning', author: 'Trevor Hastie, Robert Tibshirani, Jerome Friedman', isbn: '9780387848570', cat: 'Machine Learning', year: 2009, shelf: 'ML-405', copies: 4 },

    // 5. Data Science
    { title: 'Python for Data Analysis', author: 'Wes McKinney', isbn: '9781491957660', cat: 'Data Science', year: 2017, shelf: 'DS-501', copies: 5 },
    { title: 'Data Science from Scratch: First Principles with Python', author: 'Joel Grus', isbn: '9781492041139', cat: 'Data Science', year: 2019, shelf: 'DS-502', copies: 4 },
    { title: 'Storytelling with Data: A Data Visualization Guide for Business', author: 'Cole Nussbaumer Knaflic', isbn: '9781119002253', cat: 'Data Science', year: 2015, shelf: 'DS-503', copies: 4 },
    { title: 'Mining of Massive Datasets', author: 'Jure Leskovec, Anand Rajaraman, Jeffrey David Ullman', isbn: '9781107077232', cat: 'Data Science', year: 2014, shelf: 'DS-504', copies: 4 },
    { title: 'Practical Statistics for Data Scientists', author: 'Peter Bruce, Andrew Bruce, Peter Gedeck', isbn: '9781492072942', cat: 'Data Science', year: 2020, shelf: 'DS-505', copies: 5 },

    // 6. Database Management
    { title: 'Database System Concepts', author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', isbn: '9780073523323', cat: 'Database Management', year: 2019, shelf: 'DB-601', copies: 6 },
    { title: 'Database Management Systems', author: 'Raghu Ramakrishnan, Johannes Gehrke', isbn: '9780072465631', cat: 'Database Management', year: 2002, shelf: 'DB-602', copies: 5 },
    { title: 'Fundamentals of Database Systems', author: 'Ramez Elmasri, Shamkant B. Navathe', isbn: '9780133970777', cat: 'Database Management', year: 2015, shelf: 'DB-603', copies: 5 },
    { title: 'SQL Antipatterns: Avoiding the Pitfalls of Database Programming', author: 'Bill Karwin', isbn: '9781934356555', cat: 'Database Management', year: 2010, shelf: 'DB-604', copies: 4 },
    { title: 'NoSQL Distilled: A Brief Guide to the Emerging World', author: 'Pramod J. Sadalage, Martin Fowler', isbn: '9780321826626', cat: 'Database Management', year: 2012, shelf: 'DB-605', copies: 4 },

    // 7. Cloud Computing
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781449373320', cat: 'Cloud Computing', year: 2017, shelf: 'CL-701', copies: 6 },
    { title: 'Site Reliability Engineering: How Google Runs Production Systems', author: 'Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Murphy', isbn: '9781491929124', cat: 'Cloud Computing', year: 2016, shelf: 'CL-702', copies: 5 },
    { title: 'Building Microservices: Designing Fine-Grained Systems', author: 'Sam Newman', isbn: '9781492034025', cat: 'Cloud Computing', year: 2021, shelf: 'CL-703', copies: 5 },
    { title: 'Cloud Native Patterns: Designing High-Availability Software', author: 'Cornelia Davis', isbn: '9781617294297', cat: 'Cloud Computing', year: 2019, shelf: 'CL-704', copies: 4 },
    { title: 'Kubernetes: Up and Running', author: 'Brendan Burns, Joe Beda, Kelsey Hightower', isbn: '9781492046530', cat: 'Cloud Computing', year: 2019, shelf: 'CL-705', copies: 4 },

    // 8. Cybersecurity
    { title: 'The Web Application Hacker\'s Handbook: Finding and Exploiting Vulnerabilities', author: 'Dafydd Stuttard, Marcus Pinto', isbn: '9781118026472', cat: 'Cybersecurity', year: 2011, shelf: 'SEC-801', copies: 5 },
    { title: 'Cryptography and Network Security: Principles and Practice', author: 'William Stallings', isbn: '9780134444284', cat: 'Cybersecurity', year: 2016, shelf: 'SEC-802', copies: 5 },
    { title: 'Practical Malware Analysis', author: 'Michael Sikorski, Andrew Honig', isbn: '9781593272906', cat: 'Cybersecurity', year: 2012, shelf: 'SEC-803', copies: 4 },
    { title: 'Hacking: The Art of Exploitation', author: 'Jon Erickson', isbn: '9781593271442', cat: 'Cybersecurity', year: 2008, shelf: 'SEC-804', copies: 4 },
    { title: 'Security Engineering: A Guide to Building Dependable Distributed Systems', author: 'Ross J. Anderson', isbn: '9781119642787', cat: 'Cybersecurity', year: 2020, shelf: 'SEC-805', copies: 4 },

    // 9. Mathematics
    { title: 'Discrete Mathematics and Its Applications', author: 'Kenneth H. Rosen', isbn: '9780073383095', cat: 'Mathematics', year: 2011, shelf: 'MATH-901', copies: 6 },
    { title: 'Linear Algebra and Its Applications', author: 'Gilbert Strang', isbn: '9780030105678', cat: 'Mathematics', year: 2005, shelf: 'MATH-902', copies: 5 },
    { title: 'Introduction to Linear Algebra', author: 'Gilbert Strang', isbn: '9780980232776', cat: 'Mathematics', year: 2016, shelf: 'MATH-903', copies: 5 },
    { title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '9781285741550', cat: 'Mathematics', year: 2015, shelf: 'MATH-904', copies: 5 },
    { title: 'Introduction to Probability Models', author: 'Sheldon M. Ross', isbn: '9780128143469', cat: 'Mathematics', year: 2019, shelf: 'MATH-905', copies: 4 },

    // 10. Literature
    { title: '1984', author: 'George Orwell', isbn: '9780451524935', cat: 'Literature', year: 1949, shelf: 'LIT-1001', copies: 6 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', cat: 'Literature', year: 1960, shelf: 'LIT-1002', copies: 5 },
    { title: 'Brave New World', author: 'Aldous Huxley', isbn: '9780060850524', cat: 'Literature', year: 1932, shelf: 'LIT-1003', copies: 5 },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', cat: 'Literature', year: 1925, shelf: 'LIT-1004', copies: 5 },
    { title: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '9781451673319', cat: 'Literature', year: 1953, shelf: 'LIT-1005', copies: 5 }
  ];

  const books = [];
  for (let i = 0; i < bookCatalogData.length; i++) {
    const b = bookCatalogData[i];
    const catDoc = categories.find(c => c.categoryName === b.cat);
    const catCode = `BK-${String(i + 1).padStart(3, '0')}`;
    const coverUrl = b.isbn ? `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg` : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

    const doc = await Book.findOneAndUpdate(
      { catalogCode: catCode },
      {
        bookId: catCode,
        catalogCode: catCode,
        ISBN: b.isbn,
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        publisher: 'Academic Press / Pearson / O\'Reilly Media',
        edition: 'Standard Academic Edition',
        publicationYear: b.year,
        categoryId: catDoc?._id,
        category: b.cat,
        language: 'English',
        shelfLocation: b.shelf,
        totalCopies: b.copies,
        availableCopies: b.copies, // will adjust when loans are generated
        bookStatus: 'Available',
        description: `Authoritative library reference volume on ${b.title} by ${b.author}. Recommended for university coursework and technical study.`,
        coverImage: coverUrl,
        coverUrl,
        sourceProvider: 'Open Library',
        providerReference: b.isbn,
        demoRecord: true
      },
      { upsert: true, new: true }
    );
    books.push(doc);
  }

  // 6. Generate 50 Borrow Records (Loans)
  // Distribution: 25 Returned, 15 Issued (on time), 10 Overdue
  const now = new Date();
  const loans = [];
  const bookIssuedCount = {}; // Track active loans to ensure availableCopies = totalCopies - active

  // Clean prior demo loans to ensure clean state
  await Loan.deleteMany({ demoRecord: true });

  for (let i = 1; i <= 50; i++) {
    const student = students[(i - 1) % students.length];
    const book = books[(i * 7) % books.length];
    const issuedByAdmin = admins[i % admins.length];

    let loanStatus = 'Returned';
    let status = 'Returned';
    let issuedDate, dueDate, returnDate;

    if (i <= 25) {
      // 25 Returned loans (some returned on time, some returned late)
      const daysAgo = 30 + (i * 2);
      issuedDate = new Date(now.getTime() - daysAgo * 86400000);
      dueDate = new Date(issuedDate.getTime() + 14 * 86400000);
      // Late return for 22 returned loans to create realistic fine history (30+ fines total)
      const lateDays = i <= 3 ? 0 : (i % 6) + 2;
      returnDate = new Date(dueDate.getTime() + lateDays * 86400000);
      loanStatus = 'Returned';
      status = 'Returned';
    } else if (i <= 40) {
      // 15 Active on-time loans
      const daysAgo = (i - 25);
      issuedDate = new Date(now.getTime() - daysAgo * 86400000);
      dueDate = new Date(issuedDate.getTime() + 14 * 86400000); // in future
      returnDate = null;
      loanStatus = 'Issued';
      status = 'Issued';
      bookIssuedCount[book._id.toString()] = (bookIssuedCount[book._id.toString()] || 0) + 1;
    } else {
      // 10 Active overdue loans
      const daysOverdue = (i - 40) * 2 + 1;
      dueDate = new Date(now.getTime() - daysOverdue * 86400000); // overdue in past
      issuedDate = new Date(dueDate.getTime() - 14 * 86400000);
      returnDate = null;
      loanStatus = 'Overdue';
      status = 'Issued';
      bookIssuedCount[book._id.toString()] = (bookIssuedCount[book._id.toString()] || 0) + 1;
    }

    const loanDoc = await Loan.create({
      loanId: `LN-${String(i).padStart(4, '0')}`,
      studentId: student._id,
      student: student.user || student._id,
      bookId: book._id,
      book: book._id,
      issuedDate,
      issuedAt: issuedDate,
      dueDate,
      dueAt: dueDate,
      returnDate,
      returnedAt: returnDate,
      loanStatus,
      status,
      renewalCount: (i % 4 === 0) ? 1 : 0,
      issuedBy: issuedByAdmin._id,
      returnReceivedBy: returnDate ? issuedByAdmin._id : null,
      demoRecord: true
    });
    loans.push(loanDoc);
  }

  // Update book available copies to ensure mathematical consistency
  for (const b of books) {
    const activeIssued = bookIssuedCount[b._id.toString()] || 0;
    b.availableCopies = Math.max(0, b.totalCopies - activeIssued);
    b.bookStatus = b.availableCopies === 0 ? 'Out of Stock' : b.availableCopies <= 2 ? 'Low Stock' : 'Available';
    await b.save();
  }

  // 7. Generate 50 Reservations
  await Reservation.deleteMany({ demoRecord: true });
  const reservationStatuses = ['Confirmed', 'Waiting', 'Fulfilled', 'Cancelled', 'Expired'];
  const reservations = [];

  for (let i = 1; i <= 50; i++) {
    const student = students[(i * 3) % students.length];
    const book = books[(i * 5) % books.length];
    const statusType = reservationStatuses[i % reservationStatuses.length];
    const resDate = new Date(now.getTime() - (i % 20) * 86400000);
    const expDate = new Date(resDate.getTime() + 7 * 86400000);

    const resDoc = await Reservation.create({
      reservationId: `RES-${String(i).padStart(4, '0')}`,
      studentId: student._id,
      student: student.user || student._id,
      bookId: book._id,
      book: book._id,
      reservationDate: resDate,
      reservedAt: resDate,
      expiryDate: expDate,
      reservationStatus: statusType,
      status: statusType === 'Confirmed' ? 'Approved' : statusType === 'Waiting' ? 'Pending' : statusType === 'Fulfilled' ? 'Issued' : statusType,
      queuePosition: (i % 3) + 1,
      reviewedAt: new Date(resDate.getTime() + 3600000),
      demoRecord: true
    });
    reservations.push(resDoc);
  }

  // 8. Generate 30+ Fine Records & 30 Payments
  await Fine.deleteMany({ demoRecord: true });
  await Payment.deleteMany({ demoRecord: true });
  const fines = [];
  const payments = [];

  // Filter loans that qualify for fines: 10 active overdue + 22 returned late
  const overdueOrLateLoans = loans.filter(l => {
    if (l.loanStatus === 'Overdue') return true;
    if (l.returnDate && l.returnDate > l.dueDate) return true;
    return false;
  });

  const fineRate = 5; // ₹5 per day
  for (let i = 0; i < Math.min(32, overdueOrLateLoans.length); i++) {
    const l = overdueOrLateLoans[i];
    const student = students.find(s => s._id.toString() === l.studentId?.toString()) || students[0];
    const calcDate = l.returnDate || now;
    const overdueDays = Math.max(1, Math.ceil((calcDate.getTime() - new Date(l.dueDate).getTime()) / 86400000));
    const fineAmount = overdueDays * fineRate;

    let fineStatus = 'Unpaid';
    let paidAmount = 0;
    let paymentRef = null;
    let waivedBy = null;
    let waiverReason = null;

    if (i < 15) {
      // 15 fully paid fines
      fineStatus = 'Paid';
      paidAmount = fineAmount;
      paymentRef = `REC-2026-${String(1000 + i)}`;
    } else if (i < 25) {
      // 10 unpaid fines
      fineStatus = 'Unpaid';
      paidAmount = 0;
    } else if (i < 29) {
      // 4 partially paid fines
      fineStatus = 'Partially Paid';
      paidAmount = Math.floor(fineAmount / 2);
      paymentRef = `REC-2026-${String(1000 + i)}`;
    } else {
      // 3 waived fines
      fineStatus = 'Waived';
      paidAmount = 0;
      waivedBy = admins[0]._id;
      waiverReason = 'Approved official college medical & athletic leave exemption.';
    }

    const fineDoc = await Fine.create({
      fineId: `FN-${String(i + 1).padStart(4, '0')}`,
      loanId: l._id,
      loan: l._id,
      studentId: student._id,
      student: student.user || student._id,
      calculatedDate: calcDate,
      overdueDays,
      ratePerDay: fineRate,
      fineAmount,
      amount: fineAmount,
      paidAmount,
      outstandingAmount: fineStatus === 'Waived' ? 0 : Math.max(0, fineAmount - paidAmount),
      fineStatus,
      status: fineStatus,
      paidAt: fineStatus === 'Paid' ? new Date(calcDate.getTime() + 86400000) : null,
      paymentReference: paymentRef,
      waivedBy,
      waiverReason,
      demoRecord: true
    });
    fines.push(fineDoc);

    // Create corresponding payment record if paid or partially paid
    if (paidAmount > 0) {
      const pmtMethods = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Demo Portal'];
      const pmtDoc = await Payment.create({
        paymentId: `PMT-${String(payments.length + 1).padStart(4, '0')}`,
        fineId: fineDoc._id,
        studentId: student._id,
        student: student.user || student._id,
        amount: paidAmount,
        paymentMethod: pmtMethods[payments.length % pmtMethods.length],
        paymentStatus: 'Confirmed',
        paidDate: fineDoc.paidAt || new Date(),
        receiptReference: paymentRef || `REC-2026-${String(2000 + payments.length)}`,
        recordedBy: admins[payments.length % admins.length]._id,
        demoRecord: true
      });
      payments.push(pmtDoc);
    }
  }

  // Ensure exactly 30 payments by supplementing with standalone demo receipts if needed
  while (payments.length < 30) {
    const idx = payments.length;
    const f = fines[idx % fines.length];
    const student = students[idx % students.length];
    const pmtDoc = await Payment.create({
      paymentId: `PMT-${String(payments.length + 1).padStart(4, '0')}`,
      fineId: f._id,
      studentId: student._id,
      student: student.user || student._id,
      amount: 15.00,
      paymentMethod: 'UPI',
      paymentStatus: 'Confirmed',
      paidDate: new Date(now.getTime() - idx * 86400000),
      receiptReference: `REC-2026-${String(3000 + idx)}`,
      recordedBy: admins[0]._id,
      demoRecord: true
    });
    payments.push(pmtDoc);
  }

  // 9. Generate 50 Notifications
  await Notification.deleteMany({ demoRecord: true });
  const notifTemplates = [
    { type: 'Issue', title: 'Book Issued', msg: 'Your selected title has been issued at the circulation desk.' },
    { type: 'DueSoon', title: 'Due Date Reminder', msg: 'Your borrowed book is due for return in 3 days.' },
    { type: 'Overdue', title: 'Overdue Notice', msg: 'A book borrowed on your account is overdue. Please return to prevent additional fines.' },
    { type: 'ReservationApproval', title: 'Reservation Approved', msg: 'Your book reservation is approved and waiting at the circulation desk.' },
    { type: 'ReservationRejection', title: 'Reservation Notice', msg: 'Your reservation was rejected due to unavailable physical copies.' },
    { type: 'Return', title: 'Return Confirmed', msg: 'Physical return confirmed. Inventory updated.' },
    { type: 'Fine', title: 'Fine Generated', msg: 'An overdue fine has been applied to your student account.' },
    { type: 'Payment', title: 'Payment Receipt', msg: 'Your fine payment was officially recorded by library administration.' }
  ];

  const notifications = [];
  for (let i = 1; i <= 50; i++) {
    const student = students[(i - 1) % students.length];
    const tmpl = notifTemplates[i % notifTemplates.length];
    const notifDoc = await Notification.create({
      notificationId: `NOTIF-${String(i).padStart(4, '0')}`,
      studentId: student._id,
      recipient: student.user || student._id,
      notificationType: tmpl.type,
      title: tmpl.title,
      message: `${tmpl.msg} (Ref: LMS-MSG-${String(i).padStart(3, '0')})`,
      read: i % 2 === 0,
      readAt: i % 2 === 0 ? new Date() : null,
      deliveryStatus: 'Delivered',
      demoRecord: true
    });
    notifications.push(notifDoc);
  }

  // 10. Generate 18 Return Requests (15+ required)
  await ReturnRequest.deleteMany({ demoRecord: true });
  const activeLoans = loans.filter(l => l.loanStatus === 'Issued' || l.loanStatus === 'Overdue');
  const returnRequests = [];

  for (let i = 0; i < Math.min(18, activeLoans.length); i++) {
    const l = activeLoans[i];
    const student = students.find(s => s._id.toString() === l.studentId?.toString()) || students[0];
    const reqStatus = i < 12 ? 'Pending' : 'Confirmed';

    const reqDoc = await ReturnRequest.create({
      returnRequestId: `REQ-${String(i + 1).padStart(4, '0')}`,
      studentId: student._id,
      student: student.user || student._id,
      loanId: l._id,
      requestDate: new Date(now.getTime() - (i + 1) * 3600000 * 4),
      requestStatus: reqStatus,
      confirmedBy: reqStatus === 'Confirmed' ? admins[0]._id : null,
      confirmedDate: reqStatus === 'Confirmed' ? new Date() : null,
      demoRecord: true
    });
    returnRequests.push(reqDoc);

    // If pending, mark loan status as Return Requested
    if (reqStatus === 'Pending') {
      l.status = 'Return Requested';
      l.loanStatus = 'Return Requested';
      await l.save();
    }
  }

  // Verification & Output
  console.log(`Categories inserted: ${categories.length}`);
  console.log(`Students inserted: ${students.length}`);
  console.log(`Books inserted: ${books.length}`);
  console.log(`Admin profiles inserted: ${admins.length}`);
  console.log(`Reservations inserted: ${reservations.length}`);
  console.log(`Borrow records inserted: ${loans.length}`);
  console.log(`Fine records inserted: ${fines.length}+`);
  console.log(`Payment records inserted: ${payments.length}`);
  console.log(`Notifications inserted: ${notifications.length}`);
  console.log(`Return requests inserted: ${returnRequests.length}+`);
  console.log('\nDatabase relationships verified.');
  console.log('Demo dataset generation completed successfully.');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
