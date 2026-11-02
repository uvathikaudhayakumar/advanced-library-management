/**
 * Advanced LMS Store with Dual Mode Support:
 * 1. FULL DATABASE MODE: Queries live Node.js/Express backend, MongoDB Atlas & Redis.
 * 2. DEMO MODE: Fallback browser-local demo with 50+ rich seed records in localStorage.
 */

const LMSStore = (() => {
  const STORAGE_KEY = 'lms_advanced_store_v3';
  const BACKEND_CONFIG_KEY = 'lms_backend_url';
  const listeners = [];

  // Default backend detection: localhost:3000 or saved Render URL
  let backendUrl = localStorage.getItem(BACKEND_CONFIG_KEY) || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? window.location.origin 
      : ''
  );

  let currentMode = 'DEMO_MODE'; // 'FULL_DATABASE' or 'DEMO_MODE'
  let backendHealth = null;

  // Check backend connectivity on startup
  async function checkBackendConnectivity() {
    if (!backendUrl) {
      currentMode = 'DEMO_MODE';
      notifyListeners(getState());
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/health`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        backendHealth = data;
        currentMode = 'FULL_DATABASE';
        console.log('Connected to backend in FULL DATABASE MODE:', backendHealth);
      } else {
        currentMode = 'DEMO_MODE';
        console.warn('Backend responded with error, using DEMO MODE');
      }
    } catch (e) {
      currentMode = 'DEMO_MODE';
      console.warn('Backend unreachable at', backendUrl, '- operating in DEMO MODE.');
    }
    notifyListeners(getState());
  }

  function getMode() {
    return currentMode;
  }

  function getBackendUrl() {
    return backendUrl;
  }

  function setBackendUrl(url) {
    backendUrl = url ? url.replace(/\/+$/, '') : '';
    if (backendUrl) {
      localStorage.setItem(BACKEND_CONFIG_KEY, backendUrl);
    } else {
      localStorage.removeItem(BACKEND_CONFIG_KEY);
    }
    return checkBackendConnectivity();
  }

  // --- 50 Student Seed Generator for Demo Mode ---
  function generate50DemoStudents() {
    const depts = [
      'Computer Science', 'Information Technology', 'Artificial Intelligence',
      'Data Science', 'Electronics & Comm', 'Electrical Eng', 'Mechanical Eng', 'Civil Eng'
    ];
    const firstNames = [
      'Uvathika', 'Alex', 'Priya', 'Aarav', 'Ananya', 'Rohan', 'Sneha', 'Karthik', 'Kavya', 'Rahul',
      'Diya', 'Nikhil', 'Pooja', 'Vikram', 'Meera', 'Aditi', 'Gaurav', 'Harini', 'Sameer', 'Tanvi',
      'Arjun', 'Bhavna', 'Chetan', 'Deepika', 'Dev', 'Ishaan', 'Janani', 'Madhav', 'Naveen', 'Neha',
      'Pranav', 'Rhea', 'Roshni', 'Sahil', 'Sakshi', 'Sanjana', 'Siddharth', 'Simran', 'Suresh', 'Tarun',
      'Trisha', 'Utkarsh', 'Vaishnavi', 'Varun', 'Vidya', 'Vinay', 'Yash', 'Zara', 'Abhinav', 'Anjali'
    ];
    const lastNames = ['U', 'Rivera', 'Sharma', 'Patel', 'Iyer', 'Reddy', 'Deshmukh', 'Verma', 'Kumar', 'Singh'];

    const students = [];
    for (let i = 1; i <= 50; i++) {
      const fn = firstNames[i - 1] || `Student${i}`;
      const ln = lastNames[(i * 3) % lastNames.length];
      const reg = `24MCA${String(i).padStart(3, '0')}`;
      students.push({
        id: `student_${i}`,
        studentId: `STU-${String(i).padStart(3, '0')}`,
        registerNumber: reg,
        registrationNo: reg,
        name: `${fn} ${ln}`,
        fullName: `${fn} ${ln}`,
        email: i === 1 ? 'uvathika.u2024@vitstudent.ac.in' : i === 2 ? 'alex.rivera@vitstudent.ac.in' : `student${String(i).padStart(2, '0')}@library.local`,
        department: depts[i % depts.length],
        course: 'MCA',
        year: `${(i % 4) + 1}st Year`,
        yearOfStudy: (i % 4) + 1,
        section: ['A', 'B', 'C'][i % 3],
        accountStatus: 'Active',
        role: 'student',
        demoRecord: true
      });
    }
    return students;
  }

  // --- 50 Book Seed Generator for Demo Mode ---
  function generate50DemoBooks() {
    const rawList = [
      // 1. Computer Science
      { title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest', isbn: '9780262033848', cat: 'Computer Science', year: 2009, copies: 6 },
      { title: 'Computer Systems: A Programmer\'s Perspective', author: 'Randal E. Bryant, David R. O\'Hallaron', isbn: '9780134092669', cat: 'Computer Science', year: 2015, copies: 5 },
      { title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson, Gerald Jay Sussman', isbn: '9780262510875', cat: 'Computer Science', year: 1996, copies: 4 },
      { title: 'Operating System Concepts', author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', isbn: '9781119800361', cat: 'Computer Science', year: 2018, copies: 6 },
      { title: 'Computer Networks: A Systems Approach', author: 'Larry L. Peterson, Bruce S. Davie', isbn: '9780123850591', cat: 'Computer Science', year: 2011, copies: 5 },
      // 2. Software Engineering
      { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '9780132350884', cat: 'Software Engineering', year: 2008, copies: 6 },
      { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', isbn: '9780201633610', cat: 'Software Engineering', year: 1994, copies: 5 },
      { title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', isbn: '9780134757599', cat: 'Software Engineering', year: 2018, copies: 5 },
      { title: 'The Pragmatic Programmer: Your Journey To Mastery', author: 'David Thomas, Andrew Hunt', isbn: '9780135957059', cat: 'Software Engineering', year: 2019, copies: 5 },
      { title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software', author: 'Eric Evans', isbn: '9780321125217', cat: 'Software Engineering', year: 2003, copies: 4 },
      // 3. Artificial Intelligence
      { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', isbn: '9780136042594', cat: 'Artificial Intelligence', year: 2020, copies: 6 },
      { title: 'Reinforcement Learning: An Introduction', author: 'Richard S. Sutton, Andrew G. Barto', isbn: '9780262039246', cat: 'Artificial Intelligence', year: 2018, copies: 4 },
      { title: 'Artificial Intelligence: Foundations of Computational Agents', author: 'David L. Poole, Alan K. Mackworth', isbn: '9781107195394', cat: 'Artificial Intelligence', year: 2017, copies: 4 },
      { title: 'Planning Algorithms', author: 'Steven M. LaValle', isbn: '9780521862059', cat: 'Artificial Intelligence', year: 2006, copies: 3 },
      { title: 'Probabilistic Graphical Models', author: 'Daphne Koller, Nir Friedman', isbn: '9780262013192', cat: 'Artificial Intelligence', year: 2009, copies: 4 },
      // 4. Machine Learning
      { title: 'Pattern Recognition and Machine Learning', author: 'Christopher M. Bishop', isbn: '9780387310732', cat: 'Machine Learning', year: 2006, copies: 5 },
      { title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', isbn: '9780262035613', cat: 'Machine Learning', year: 2016, copies: 6 },
      { title: 'Hands-On Machine Learning with Scikit-Learn', author: 'Aurélien Géron', isbn: '9781492032649', cat: 'Machine Learning', year: 2019, copies: 5 },
      { title: 'Machine Learning: A Probabilistic Perspective', author: 'Kevin P. Murphy', isbn: '9780262018029', cat: 'Machine Learning', year: 2012, copies: 4 },
      { title: 'The Elements of Statistical Learning', author: 'Trevor Hastie, Robert Tibshirani', isbn: '9780387848570', cat: 'Machine Learning', year: 2009, copies: 4 },
      // 5. Data Science
      { title: 'Python for Data Analysis', author: 'Wes McKinney', isbn: '9781491957660', cat: 'Data Science', year: 2017, copies: 5 },
      { title: 'Data Science from Scratch', author: 'Joel Grus', isbn: '9781492041139', cat: 'Data Science', year: 2019, copies: 4 },
      { title: 'Storytelling with Data', author: 'Cole Nussbaumer Knaflic', isbn: '9781119002253', cat: 'Data Science', year: 2015, copies: 4 },
      { title: 'Mining of Massive Datasets', author: 'Jure Leskovec, Anand Rajaraman', isbn: '9781107077232', cat: 'Data Science', year: 2014, copies: 4 },
      { title: 'Practical Statistics for Data Scientists', author: 'Peter Bruce, Andrew Bruce', isbn: '9781492072942', cat: 'Data Science', year: 2020, copies: 5 },
      // 6. Database Management
      { title: 'Database System Concepts', author: 'Abraham Silberschatz, Henry F. Korth', isbn: '9780073523323', cat: 'Database Management', year: 2019, copies: 6 },
      { title: 'Database Management Systems', author: 'Raghu Ramakrishnan, Johannes Gehrke', isbn: '9780072465631', cat: 'Database Management', year: 2002, copies: 5 },
      { title: 'Fundamentals of Database Systems', author: 'Ramez Elmasri, Shamkant B. Navathe', isbn: '9780133970777', cat: 'Database Management', year: 2015, copies: 5 },
      { title: 'SQL Antipatterns', author: 'Bill Karwin', isbn: '9781934356555', cat: 'Database Management', year: 2010, copies: 4 },
      { title: 'NoSQL Distilled', author: 'Pramod J. Sadalage, Martin Fowler', isbn: '9780321826626', cat: 'Database Management', year: 2012, copies: 4 },
      // 7. Cloud Computing
      { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781449373320', cat: 'Cloud Computing', year: 2017, copies: 6 },
      { title: 'Site Reliability Engineering', author: 'Betsy Beyer, Chris Jones', isbn: '9781491929124', cat: 'Cloud Computing', year: 2016, copies: 5 },
      { title: 'Building Microservices', author: 'Sam Newman', isbn: '9781492034025', cat: 'Cloud Computing', year: 2021, copies: 5 },
      { title: 'Cloud Native Patterns', author: 'Cornelia Davis', isbn: '9781617294297', cat: 'Cloud Computing', year: 2019, copies: 4 },
      { title: 'Kubernetes: Up and Running', author: 'Brendan Burns, Joe Beda', isbn: '9781492046530', cat: 'Cloud Computing', year: 2019, copies: 4 },
      // 8. Cybersecurity
      { title: 'The Web Application Hacker\'s Handbook', author: 'Dafydd Stuttard, Marcus Pinto', isbn: '9781118026472', cat: 'Cybersecurity', year: 2011, copies: 5 },
      { title: 'Cryptography and Network Security', author: 'William Stallings', isbn: '9780134444284', cat: 'Cybersecurity', year: 2016, copies: 5 },
      { title: 'Practical Malware Analysis', author: 'Michael Sikorski, Andrew Honig', isbn: '9781593272906', cat: 'Cybersecurity', year: 2012, copies: 4 },
      { title: 'Hacking: The Art of Exploitation', author: 'Jon Erickson', isbn: '9781593271442', cat: 'Cybersecurity', year: 2008, copies: 4 },
      { title: 'Security Engineering', author: 'Ross J. Anderson', isbn: '9781119642787', cat: 'Cybersecurity', year: 2020, copies: 4 },
      // 9. Mathematics
      { title: 'Discrete Mathematics and Its Applications', author: 'Kenneth H. Rosen', isbn: '9780073383095', cat: 'Mathematics', year: 2011, copies: 6 },
      { title: 'Linear Algebra and Its Applications', author: 'Gilbert Strang', isbn: '9780030105678', cat: 'Mathematics', year: 2005, copies: 5 },
      { title: 'Introduction to Linear Algebra', author: 'Gilbert Strang', isbn: '9780980232776', cat: 'Mathematics', year: 2016, copies: 5 },
      { title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '9781285741550', cat: 'Mathematics', year: 2015, copies: 5 },
      { title: 'Introduction to Probability Models', author: 'Sheldon M. Ross', isbn: '9780128143469', cat: 'Mathematics', year: 2019, copies: 4 },
      // 10. Literature
      { title: '1984', author: 'George Orwell', isbn: '9780451524935', cat: 'Literature', year: 1949, copies: 6 },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', cat: 'Literature', year: 1960, copies: 5 },
      { title: 'Brave New World', author: 'Aldous Huxley', isbn: '9780060850524', cat: 'Literature', year: 1932, copies: 5 },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', cat: 'Literature', year: 1925, copies: 5 },
      { title: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '9781451673319', cat: 'Literature', year: 1953, copies: 5 }
    ];

    return rawList.map((b, idx) => ({
      id: `book_${idx + 1}`,
      catalogCode: `BK-${String(idx + 1).padStart(3, '0')}`,
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      category: b.cat,
      totalCopies: b.copies,
      availableCopies: b.copies, // will adjust when loans seed
      coverUrl: `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg`,
      publishedYear: b.year,
      rating: (4.4 + (idx % 6) * 0.1).toFixed(1),
      description: `Authoritative library reference text on ${b.title} by ${b.author}. Standard curriculum recommended.`,
      demoRecord: true
    }));
  }

  function getInitialState() {
    const today = new Date();
    const students = generate50DemoStudents();
    const books = generate50DemoBooks();

    // 50 Demo Loans
    const loans = [];
    const bookActiveCount = {};

    for (let i = 1; i <= 50; i++) {
      const student = students[(i - 1) % students.length];
      const book = books[(i * 7) % books.length];

      let status = 'Returned';
      let issuedAt, dueAt, returnedAt;

      if (i <= 25) {
        const daysAgo = 30 + i * 2;
        issuedAt = new Date(today.getTime() - daysAgo * 86400000).toISOString();
        dueAt = new Date(new Date(issuedAt).getTime() + 14 * 86400000).toISOString();
        returnedAt = new Date(new Date(dueAt).getTime() + ((i > 3 ? (i % 6) + 2 : 0) * 86400000)).toISOString();
      } else if (i <= 40) {
        issuedAt = new Date(today.getTime() - (i - 25) * 86400000).toISOString();
        dueAt = new Date(today.getTime() + (14 - (i - 25)) * 86400000).toISOString();
        returnedAt = null;
        status = 'Issued';
        bookActiveCount[book.id] = (bookActiveCount[book.id] || 0) + 1;
      } else {
        const overdueDays = (i - 40) * 2 + 1;
        dueAt = new Date(today.getTime() - overdueDays * 86400000).toISOString();
        issuedAt = new Date(new Date(dueAt).getTime() - 14 * 86400000).toISOString();
        returnedAt = null;
        status = 'Issued';
        bookActiveCount[book.id] = (bookActiveCount[book.id] || 0) + 1;
      }

      loans.push({
        id: `loan_${i}`,
        loanId: `LN-${String(i).padStart(4, '0')}`,
        studentId: student.id,
        bookId: book.id,
        issuedAt,
        dueAt,
        returnedAt,
        status,
        demoRecord: true
      });
    }

    // Mathematical consistency: available = total - active
    books.forEach(b => {
      const active = bookActiveCount[b.id] || 0;
      b.availableCopies = Math.max(0, b.totalCopies - active);
    });

    // 50 Demo Reservations
    const reservations = [];
    const resTypes = ['Approved', 'Pending', 'Issued', 'Cancelled', 'Expired'];
    for (let i = 1; i <= 50; i++) {
      const student = students[(i * 3) % students.length];
      const book = books[(i * 5) % books.length];
      const st = resTypes[i % resTypes.length];
      reservations.push({
        id: `res_${i}`,
        reservationId: `RES-${String(i).padStart(4, '0')}`,
        studentId: student.id,
        bookId: book.id,
        status: st,
        createdAt: new Date(today.getTime() - (i % 15) * 86400000).toISOString(),
        demoRecord: true
      });
    }

    // 32 Fines & 30 Payments
    const fines = [];
    const payments = [];
    let pmtCount = 0;

    for (let i = 1; i <= 32; i++) {
      const l = loans[i % loans.length];
      const student = students.find(s => s.id === l.studentId) || students[0];
      const book = books.find(b => b.id === l.bookId) || books[0];
      const overdueDays = (i % 7) + 2;
      const amount = overdueDays * 5;
      const isPaid = i <= 15;
      const isPartial = i > 25 && i <= 29;
      const isWaived = i > 29;

      const fineStatus = isWaived ? 'Waived' : isPaid ? 'Paid' : isPartial ? 'Partially Paid' : 'Unpaid';
      const paidAmount = isWaived ? 0 : isPaid ? amount : isPartial ? Math.floor(amount / 2) : 0;
      const ref = (isPaid || isPartial) ? `REC-2026-${String(1000 + i)}` : null;

      fines.push({
        id: `fine_${i}`,
        fineId: `FN-${String(i).padStart(4, '0')}`,
        studentId: student.id,
        loanId: l.id,
        bookTitle: book.title,
        overdueDays,
        amount,
        fineAmount: amount,
        paidAmount,
        outstandingAmount: Math.max(0, amount - paidAmount),
        status: fineStatus,
        paymentReference: ref,
        createdAt: new Date(today.getTime() - i * 86400000).toISOString(),
        demoRecord: true
      });

      if (paidAmount > 0 && pmtCount < 30) {
        pmtCount++;
        payments.push({
          id: `pmt_${pmtCount}`,
          paymentId: `PMT-${String(pmtCount).padStart(4, '0')}`,
          fineId: `fine_${i}`,
          studentId: student.id,
          amount: paidAmount,
          paymentMethod: ['UPI', 'Cash', 'Card'][pmtCount % 3],
          receiptReference: ref,
          paidDate: new Date(today.getTime() - (i - 1) * 86400000).toISOString(),
          demoRecord: true
        });
      }
    }

    // Fill remaining payments to reach 30
    while (payments.length < 30) {
      pmtCount++;
      payments.push({
        id: `pmt_${pmtCount}`,
        paymentId: `PMT-${String(pmtCount).padStart(4, '0')}`,
        fineId: `fine_${(pmtCount % 15) + 1}`,
        studentId: students[pmtCount % students.length].id,
        amount: 25.00,
        paymentMethod: 'UPI',
        receiptReference: `REC-2026-${String(3000 + pmtCount)}`,
        paidDate: new Date(today.getTime() - pmtCount * 86400000).toISOString(),
        demoRecord: true
      });
    }

    // 50 Notifications
    const notifications = [];
    const notifTemplates = [
      'Book Issued: Please collect from circulation desk.',
      'Reminder: Due date in 3 days.',
      'Notice: Book overdue. Return to prevent fine.',
      'Reservation Approved: Ready for pickup.',
      'Return Confirmed: Inventory updated.',
      'Fine Cleared: Official receipt generated.'
    ];
    for (let i = 1; i <= 50; i++) {
      notifications.push({
        id: `notif_${i}`,
        recipientId: students[(i - 1) % students.length].id,
        title: notifTemplates[i % notifTemplates.length].split(':')[0],
        message: notifTemplates[i % notifTemplates.length],
        read: i % 2 === 0,
        createdAt: new Date(today.getTime() - (i % 5) * 86400000).toISOString(),
        demoRecord: true
      });
    }

    return {
      settings: { finePerDay: 5, dueSoonDays: 3, lowStockThreshold: 2 },
      currentUser: {
        id: 'admin_1',
        name: 'Library Administrator',
        email: 'admin@library.local',
        role: 'admin'
      },
      students,
      books,
      loans,
      reservations,
      fines,
      payments,
      notifications
    };
  }

  function loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const initial = getInitialState();
        saveState(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      return getInitialState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      notifyListeners(state);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  function notifyListeners(state) {
    listeners.forEach(fn => {
      try { fn(state, currentMode); } catch (e) {}
    });
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  // --- CRUD WRAPPERS (Uses REST API if in FULL DATABASE MODE, LocalStorage in DEMO MODE) ---

  async function fetchLiveDashboard() {
    if (currentMode === 'FULL_DATABASE' && backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/admin/dashboard`, { credentials: 'include' });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Live API fetch error, using local state:', e.message);
      }
    }
    return getDashboardStats();
  }

  async function fetchLiveBooks(query = '', category = 'All') {
    if (currentMode === 'FULL_DATABASE' && backendUrl) {
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (category && category !== 'All') params.append('category', category);

        const res = await fetch(`${backendUrl}/api/books?${params.toString()}`, { credentials: 'include' });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Live API fetch error:', e.message);
      }
    }
    return getBooks();
  }

  async function fetchLiveAnalytics() {
    if (currentMode === 'FULL_DATABASE' && backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/admin/analytics`, { credentials: 'include' });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  // Local sync getters & actions
  function getState() { return loadState(); }
  function setCurrentUser(user) {
    const s = loadState();
    s.currentUser = user;
    saveState(s);
  }

  function getBooks() { return loadState().books; }
  function addBook(bookData) {
    const state = loadState();
    const totalCopies = Math.max(1, Number(bookData.totalCopies || 1));
    const newBook = {
      id: bookData.id || `book_${Date.now()}`,
      catalogCode: bookData.catalogCode || `BK-${Date.now().toString().slice(-4)}`,
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      isbn: bookData.isbn || '—',
      category: bookData.category || 'General',
      coverUrl: bookData.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      totalCopies,
      availableCopies: totalCopies,
      publishedYear: bookData.publishedYear || new Date().getFullYear(),
      rating: bookData.rating || 4.8,
      description: bookData.description || 'Library reference volume.'
    };
    state.books.unshift(newBook);
    saveState(state);

    // If backend is configured, sync to database asynchronously
    if (currentMode === 'FULL_DATABASE' && backendUrl) {
      fetch(`${backendUrl}/api/admin/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
        credentials: 'include'
      }).catch(err => console.warn('Database sync notice:', err.message));
    }
    return newBook;
  }

  function updateBook(id, fields) {
    const state = loadState();
    const idx = state.books.findIndex(b => b.id === id);
    if (idx !== -1) {
      state.books[idx] = { ...state.books[idx], ...fields };
      saveState(state);
      return state.books[idx];
    }
    return null;
  }

  function deleteBook(id) {
    const state = loadState();
    state.books = state.books.filter(b => b.id !== id);
    saveState(state);
  }

  function getStudents() { return loadState().students; }
  function addStudent(studentData) {
    const state = loadState();
    const regNo = studentData.registrationNo.trim().toUpperCase();
    const email = studentData.email.trim().toLowerCase();

    const newStudent = {
      id: `student_${Date.now()}`,
      studentId: `STU-${Date.now().toString().slice(-3)}`,
      registerNumber: regNo,
      registrationNo: regNo,
      name: studentData.name.trim(),
      fullName: studentData.name.trim(),
      email,
      department: studentData.department || 'Computer Science',
      year: studentData.year || '1st Year',
      role: 'student',
      accountStatus: 'Active'
    };
    state.students.unshift(newStudent);
    saveState(state);
    return newStudent;
  }

  function getLoans() {
    const state = loadState();
    return state.loans.map(l => {
      const student = state.students.find(s => s.id === l.studentId);
      const book = state.books.find(b => b.id === l.bookId);
      return { ...l, student, book };
    });
  }

  function issueLoan(studentId, bookId, dueDateString) {
    const state = loadState();
    const student = state.students.find(s => s.id === studentId);
    const book = state.books.find(b => b.id === bookId);

    if (!student) throw new Error('Invalid student account.');
    if (!book || book.availableCopies < 1) throw new Error('Selected book has no available copies.');

    book.availableCopies -= 1;
    const loan = {
      id: `loan_${Date.now()}`,
      loanId: `LN-${Date.now().toString().slice(-4)}`,
      studentId,
      bookId,
      issuedAt: new Date().toISOString(),
      dueAt: new Date(dueDateString).toISOString(),
      returnedAt: null,
      status: 'Issued'
    };
    state.loans.unshift(loan);
    saveState(state);
    return loan;
  }

  function requestReturn(loanId, studentId) {
    const state = loadState();
    const loan = state.loans.find(l => l.id === loanId);
    if (loan) {
      loan.status = 'Return Requested';
      saveState(state);
    }
  }

  function confirmReturn(loanId) {
    const state = loadState();
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) throw new Error('Loan not found.');

    const now = new Date();
    loan.status = 'Returned';
    loan.returnedAt = now.toISOString();

    const book = state.books.find(b => b.id === loan.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    const dueTime = new Date(loan.dueAt).getTime();
    const overdueDays = Math.max(0, Math.ceil((now.getTime() - dueTime) / 86400000));
    let fineGenerated = null;

    if (overdueDays > 0) {
      const amount = overdueDays * (state.settings.finePerDay || 5);
      fineGenerated = {
        id: `fine_${Date.now()}`,
        fineId: `FN-${Date.now().toString().slice(-4)}`,
        studentId: loan.studentId,
        loanId: loan.id,
        bookTitle: book?.title || 'Library Book',
        overdueDays,
        amount,
        fineAmount: amount,
        paidAmount: 0,
        outstandingAmount: amount,
        status: 'Unpaid',
        createdAt: now.toISOString()
      };
      state.fines.unshift(fineGenerated);
    }

    saveState(state);
    return { overdueDays, fineGenerated };
  }

  function getReservations() {
    const state = loadState();
    return state.reservations.map(r => {
      const student = state.students.find(s => s.id === r.studentId);
      const book = state.books.find(b => b.id === r.bookId);
      return { ...r, student, book };
    });
  }

  function createReservation(studentId, bookId) {
    const state = loadState();
    const book = state.books.find(b => b.id === bookId);
    if (!book || book.availableCopies < 1) throw new Error('Book currently unavailable.');

    const item = {
      id: `res_${Date.now()}`,
      reservationId: `RES-${Date.now().toString().slice(-4)}`,
      studentId,
      bookId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    state.reservations.unshift(item);
    saveState(state);
    return item;
  }

  function updateReservationStatus(resId, newStatus) {
    const state = loadState();
    const item = state.reservations.find(r => r.id === resId);
    if (item) {
      item.status = newStatus;
      const book = state.books.find(b => b.id === item.bookId);
      if (newStatus === 'Approved' && book && book.availableCopies > 0) {
        book.availableCopies -= 1;
      }
      saveState(state);
    }
  }

  function cancelReservation(resId) {
    const state = loadState();
    const idx = state.reservations.findIndex(r => r.id === resId);
    if (idx !== -1) {
      state.reservations.splice(idx, 1);
      saveState(state);
    }
  }

  function getFines() {
    const state = loadState();
    return state.fines.map(f => {
      const student = state.students.find(s => s.id === f.studentId);
      return { ...f, student };
    });
  }

  function payFine(fineId, ref) {
    const state = loadState();
    const fine = state.fines.find(f => f.id === fineId);
    if (fine) {
      fine.status = 'Paid';
      fine.paidAmount = fine.amount;
      fine.outstandingAmount = 0;
      fine.paymentReference = ref;
      fine.paidAt = new Date().toISOString();

      state.payments.unshift({
        id: `pmt_${Date.now()}`,
        paymentId: `PMT-${Date.now().toString().slice(-4)}`,
        fineId: fine.id,
        studentId: fine.studentId,
        amount: fine.amount,
        paymentMethod: 'Cash/Receipt',
        receiptReference: ref,
        paidDate: new Date().toISOString()
      });
      saveState(state);
    }
    return fine;
  }

  function getAlerts() {
    const state = loadState();
    const now = new Date();
    const alerts = [];

    state.loans.forEach(loan => {
      if (loan.status !== 'Returned') {
        const due = new Date(loan.dueAt);
        if (due < now) {
          const daysOver = Math.ceil((now - due) / 86400000);
          const student = state.students.find(s => s.id === loan.studentId);
          const book = state.books.find(b => b.id === loan.bookId);
          alerts.push({
            id: `alert_overdue_${loan.id}`,
            priority: 'Critical',
            title: `Overdue Loan (${daysOver}d)`,
            message: `"${book?.title || 'Book'}" issued to ${student?.name || 'Student'} is overdue by ${daysOver} days.`,
            createdAt: loan.dueAt,
            type: 'overdue'
          });
        }
      }
    });

    state.books.forEach(book => {
      if (book.availableCopies <= 2) {
        alerts.push({
          id: `alert_stock_${book.id}`,
          priority: book.availableCopies === 0 ? 'Critical' : 'High',
          title: book.availableCopies === 0 ? 'Out of Stock' : 'Low Stock Warning',
          message: `"${book.title}" has ${book.availableCopies} available copies remaining (Total: ${book.totalCopies}).`,
          createdAt: new Date().toISOString(),
          type: 'stock'
        });
      }
    });

    return alerts;
  }

  function getDashboardStats() {
    const state = loadState();
    const now = new Date();

    return {
      totalStudents: state.students.length,
      totalTitles: state.books.length,
      totalCopies: state.books.reduce((a, b) => a + (Number(b.totalCopies) || 0), 0),
      availableCopies: state.books.reduce((a, b) => a + (Number(b.availableCopies) || 0), 0),
      activeLoans: state.loans.filter(l => l.status !== 'Returned').length,
      overdueLoans: state.loans.filter(l => l.status !== 'Returned' && new Date(l.dueAt) < now).length,
      pendingReservations: state.reservations.filter(r => r.status === 'Pending').length,
      returnRequestsCount: state.loans.filter(l => l.status === 'Return Requested').length,
      unpaidFines: state.fines.filter(f => f.status === 'Unpaid' || f.status === 'Partially Paid').reduce((s, f) => s + (f.outstandingAmount || f.amount || 0), 0),
      collectedFines: state.fines.filter(f => f.status === 'Paid').reduce((s, f) => s + (f.amount || 0), 0)
    };
  }

  function resetDemoData() {
    const initial = getInitialState();
    saveState(initial);
    return initial;
  }

  // Check connectivity immediately
  checkBackendConnectivity();

  return {
    getMode,
    getBackendUrl,
    setBackendUrl,
    checkBackendConnectivity,
    fetchLiveDashboard,
    fetchLiveBooks,
    fetchLiveAnalytics,
    getState,
    subscribe,
    setCurrentUser,
    getBooks,
    addBook,
    updateBook,
    deleteBook,
    getStudents,
    addStudent,
    getLoans,
    issueLoan,
    requestReturn,
    confirmReturn,
    getReservations,
    createReservation,
    updateReservationStatus,
    cancelReservation,
    getFines,
    payFine,
    getAlerts,
    getDashboardStats,
    resetDemoData
  };
})();
