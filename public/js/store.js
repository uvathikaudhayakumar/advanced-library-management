/**
 * Local Data Store & Reactive State Manager
 * Provides offline/Netlify persistence with full CRUD, validation,
 * automatic fine calculation, and priority alert generation.
 */

const LMSStore = (() => {
  const STORAGE_KEY = 'lms_advanced_store_v2';
  const listeners = [];

  const defaultSettings = {
    finePerDay: 5,        // ₹5 per day
    dueSoonDays: 3,       // Alert when 3 days remaining
    lowStockThreshold: 2  // Alert when available copies <= 2
  };

  const defaultStudents = [
    {
      id: 'student_1',
      name: 'Uvathika U',
      email: 'uvathika.u2024@vitstudent.ac.in',
      registrationNo: '24MCA001',
      department: 'Computer Science & Engineering',
      year: '2nd Year',
      role: 'student',
      active: true,
      createdAt: new Date('2026-09-01T09:00:00Z').toISOString()
    },
    {
      id: 'student_2',
      name: 'Alex Rivera',
      email: 'alex.rivera@vitstudent.ac.in',
      registrationNo: '24MCA042',
      department: 'Software Systems',
      year: '2nd Year',
      role: 'student',
      active: true,
      createdAt: new Date('2026-09-02T10:00:00Z').toISOString()
    },
    {
      id: 'student_3',
      name: 'Priya Sharma',
      email: 'priya.sharma@vitstudent.ac.in',
      registrationNo: '24MCA089',
      department: 'Data Science',
      year: '1st Year',
      role: 'student',
      active: true,
      createdAt: new Date('2026-09-05T11:00:00Z').toISOString()
    }
  ];

  function getInitialState() {
    const today = new Date();
    
    // Dates for seed loans
    const pastOverdueDue = new Date(today.getTime() - 4 * 86400000);   // Overdue by 4 days
    const pastIssuedOverdue = new Date(today.getTime() - 18 * 86400000);

    const dueSoonDue = new Date(today.getTime() + 2 * 86400000);       // Due in 2 days
    const pastIssuedSoon = new Date(today.getTime() - 12 * 86400000);

    const activeNormalDue = new Date(today.getTime() + 10 * 86400000);  // Due in 10 days
    const pastIssuedNormal = new Date(today.getTime() - 4 * 86400000);

    return {
      settings: defaultSettings,
      currentUser: {
        id: 'admin_1',
        name: 'Library Administrator',
        email: 'admin@library.local',
        role: 'admin'
      },
      students: defaultStudents,
      books: PublicAPIService.getCuratedBooks(),
      loans: [
        {
          id: 'loan_1',
          studentId: 'student_1',
          bookId: 'book_curated_1',
          issuedAt: pastIssuedOverdue.toISOString(),
          dueAt: pastOverdueDue.toISOString(),
          returnedAt: null,
          status: 'Issued' // Will be flagged as overdue
        },
        {
          id: 'loan_2',
          studentId: 'student_1',
          bookId: 'book_curated_3',
          issuedAt: pastIssuedSoon.toISOString(),
          dueAt: dueSoonDue.toISOString(),
          returnedAt: null,
          status: 'Return Requested'
        },
        {
          id: 'loan_3',
          studentId: 'student_2',
          bookId: 'book_curated_2',
          issuedAt: pastIssuedNormal.toISOString(),
          dueAt: activeNormalDue.toISOString(),
          returnedAt: null,
          status: 'Issued'
        }
      ],
      reservations: [
        {
          id: 'res_1',
          studentId: 'student_1',
          bookId: 'book_curated_7',
          status: 'Pending',
          createdAt: new Date(today.getTime() - 1 * 86400000).toISOString()
        },
        {
          id: 'res_2',
          studentId: 'student_3',
          bookId: 'book_curated_4',
          status: 'Approved',
          createdAt: new Date(today.getTime() - 2 * 86400000).toISOString()
        }
      ],
      fines: [
        {
          id: 'fine_1',
          studentId: 'student_2',
          loanId: 'past_loan_0',
          bookTitle: 'Computer Networking: A Top-Down Approach',
          overdueDays: 3,
          amount: 15,
          status: 'Paid',
          paymentReference: 'REC-2026-8812',
          createdAt: new Date(today.getTime() - 10 * 86400000).toISOString(),
          paidAt: new Date(today.getTime() - 9 * 86400000).toISOString()
        }
      ],
      notifications: [
        {
          id: 'notif_1',
          recipientId: 'student_1',
          title: 'Loan Due Soon Reminder',
          message: 'Your loan for "Artificial Intelligence: A Modern Approach" is due in 2 days.',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notif_2',
          recipientId: 'student_1',
          title: 'Reservation Approved',
          message: 'Your reservation for "Database System Concepts" was approved.',
          read: true,
          createdAt: new Date(today.getTime() - 2 * 86400000).toISOString()
        }
      ]
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
      console.error('Failed to load local state, using initial:', e);
      return getInitialState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      notifyListeners(state);
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  function notifyListeners(state) {
    listeners.forEach(fn => {
      try { fn(state); } catch (err) { console.error('Listener error:', err); }
    });
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  // --- Core CRUD Operations ---

  function getState() {
    return loadState();
  }

  function setCurrentUser(user) {
    const state = loadState();
    state.currentUser = user;
    saveState(state);
  }

  // Books
  function getBooks() {
    return loadState().books;
  }

  function addBook(bookData) {
    const state = loadState();
    const totalCopies = Math.max(1, Number(bookData.totalCopies || 1));
    const newBook = {
      id: bookData.id || 'book_' + Date.now(),
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      isbn: bookData.isbn || '—',
      category: bookData.category || 'General',
      coverUrl: bookData.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      totalCopies: totalCopies,
      availableCopies: totalCopies,
      publishedYear: bookData.publishedYear || new Date().getFullYear(),
      rating: bookData.rating || 4.5,
      description: bookData.description || 'Library reference book.'
    };
    state.books.unshift(newBook);
    saveState(state);
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

  // Students
  function getStudents() {
    return loadState().students;
  }

  function addStudent(studentData) {
    const state = loadState();
    const email = studentData.email.toLowerCase().trim();
    const regNo = studentData.registrationNo.trim();

    if (state.students.some(s => s.email.toLowerCase() === email || s.registrationNo.toUpperCase() === regNo.toUpperCase())) {
      throw new Error('Email or registration number already registered.');
    }

    const newStudent = {
      id: 'student_' + Date.now(),
      name: studentData.name.trim(),
      email,
      registrationNo: regNo,
      department: studentData.department || 'Computer Science',
      year: studentData.year || '1st Year',
      role: 'student',
      active: true,
      createdAt: new Date().toISOString()
    };
    state.students.push(newStudent);
    saveState(state);
    return newStudent;
  }

  // Reservations
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
    if (!book) throw new Error('Book not found.');
    if (book.availableCopies < 1) throw new Error('No copies currently available to reserve.');

    // Limit active reservations to 3
    const activeRes = state.reservations.filter(r => r.studentId === studentId && r.status === 'Pending');
    if (activeRes.length >= 3) {
      throw new Error('You already have 3 pending reservations. Limit reached.');
    }

    const resItem = {
      id: 'res_' + Date.now(),
      studentId,
      bookId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    state.reservations.unshift(resItem);

    // Create Notification
    state.notifications.unshift({
      id: 'notif_' + Date.now(),
      recipientId: studentId,
      title: 'Reservation Submitted',
      message: `Your reservation request for "${book.title}" was submitted.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState(state);
    return resItem;
  }

  function updateReservationStatus(resId, newStatus) {
    const state = loadState();
    const item = state.reservations.find(r => r.id === resId);
    if (!item) throw new Error('Reservation not found.');
    
    item.status = newStatus;
    item.reviewedAt = new Date().toISOString();

    const book = state.books.find(b => b.id === item.bookId);

    // If approved, reserve a copy
    if (newStatus === 'Approved' && book) {
      if (book.availableCopies > 0) {
        book.availableCopies -= 1;
      }
    }

    state.notifications.unshift({
      id: 'notif_' + Date.now(),
      recipientId: item.studentId,
      title: `Reservation ${newStatus}`,
      message: `Your reservation for "${book?.title || 'the book'}" has been ${newStatus.toLowerCase()}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState(state);
  }

  function cancelReservation(resId, studentId) {
    const state = loadState();
    const idx = state.reservations.findIndex(r => r.id === resId && r.studentId === studentId);
    if (idx !== -1) {
      const item = state.reservations[idx];
      if (item.status === 'Approved') {
        const book = state.books.find(b => b.id === item.bookId);
        if (book) book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      }
      state.reservations.splice(idx, 1);
      saveState(state);
    }
  }

  // Loans (Issue & Return)
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

    const dueAt = new Date(dueDateString);
    if (isNaN(dueAt.getTime()) || dueAt <= new Date()) {
      throw new Error('Please specify a valid future due date.');
    }

    book.availableCopies -= 1;
    const loan = {
      id: 'loan_' + Date.now(),
      studentId,
      bookId,
      issuedAt: new Date().toISOString(),
      dueAt: dueAt.toISOString(),
      returnedAt: null,
      status: 'Issued'
    };

    state.loans.unshift(loan);

    // Notify student
    state.notifications.unshift({
      id: 'notif_' + Date.now(),
      recipientId: studentId,
      title: 'Book Issued',
      message: `"${book.title}" was issued to you. Due date: ${dueAt.toLocaleDateString()}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState(state);
    return loan;
  }

  function requestReturn(loanId, studentId) {
    const state = loadState();
    const loan = state.loans.find(l => l.id === loanId && l.studentId === studentId);
    if (!loan) throw new Error('Loan record not found.');
    if (loan.status === 'Returned') throw new Error('Book is already marked returned.');
    
    loan.status = 'Return Requested';
    saveState(state);
  }

  function confirmReturn(loanId) {
    const state = loadState();
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) throw new Error('Loan not found.');
    if (loan.status === 'Returned') throw new Error('Loan already returned.');

    const now = new Date();
    loan.status = 'Returned';
    loan.returnedAt = now.toISOString();

    const book = state.books.find(b => b.id === loan.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    // Overdue Fine calculation
    const dueTime = new Date(loan.dueAt).getTime();
    const returnTime = now.getTime();
    const overdueDays = Math.max(0, Math.ceil((returnTime - dueTime) / 86400000));
    let fineGenerated = null;

    if (overdueDays > 0) {
      const finePerDay = state.settings.finePerDay || 5;
      const amount = overdueDays * finePerDay;
      fineGenerated = {
        id: 'fine_' + Date.now(),
        studentId: loan.studentId,
        loanId: loan.id,
        bookTitle: book?.title || 'Library Book',
        overdueDays,
        amount,
        status: 'Unpaid',
        paymentReference: null,
        createdAt: now.toISOString(),
        paidAt: null
      };
      state.fines.unshift(fineGenerated);

      state.notifications.unshift({
        id: 'notif_' + Date.now(),
        recipientId: loan.studentId,
        title: 'Overdue Fine Generated',
        message: `A fine of ₹${amount} was generated for late return of "${book?.title || 'Book'}" (${overdueDays} days overdue).`,
        read: false,
        createdAt: now.toISOString()
      });
    }

    state.notifications.unshift({
      id: 'notif_' + (Date.now() + 1),
      recipientId: loan.studentId,
      title: 'Return Confirmed',
      message: `Return confirmed for "${book?.title || 'Book'}". Thank you!`,
      read: false,
      createdAt: now.toISOString()
    });

    saveState(state);
    return { overdueDays, fineGenerated };
  }

  // Fines
  function getFines() {
    const state = loadState();
    return state.fines.map(f => {
      const student = state.students.find(s => s.id === f.studentId);
      return { ...f, student };
    });
  }

  function payFine(fineId, reference) {
    const state = loadState();
    const fine = state.fines.find(f => f.id === fineId);
    if (!fine) throw new Error('Fine record not found.');
    if (fine.status === 'Paid') throw new Error('Fine already marked as paid.');

    fine.status = 'Paid';
    fine.paidAt = new Date().toISOString();
    fine.paymentReference = (reference || 'Admin-Confirmed Receipt').trim();

    state.notifications.unshift({
      id: 'notif_' + Date.now(),
      recipientId: fine.studentId,
      title: 'Fine Payment Confirmed',
      message: `Your fine payment of ₹${fine.amount} has been cleared. Receipt ref: ${fine.paymentReference}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveState(state);
    return fine;
  }

  // Alerts & Analytics
  function getAlerts() {
    const state = loadState();
    const now = new Date();
    const alerts = [];

    // 1. Overdue loans
    state.loans.forEach(loan => {
      if (loan.status !== 'Returned') {
        const due = new Date(loan.dueAt);
        if (due < now) {
          const daysOver = Math.ceil((now - due) / 86400000);
          const student = state.students.find(s => s.id === loan.studentId);
          const book = state.books.find(b => b.id === loan.bookId);
          alerts.push({
            id: 'alert_overdue_' + loan.id,
            priority: 'Critical',
            title: `Overdue Loan (${daysOver}d overdue)`,
            message: `"${book?.title || 'Book'}" issued to ${student?.name || 'Student'} is overdue by ${daysOver} days.`,
            createdAt: loan.dueAt,
            read: false,
            type: 'overdue'
          });
        }
      }
    });

    // 2. Due soon loans
    const dueSoonThreshold = (state.settings.dueSoonDays || 3) * 86400000;
    state.loans.forEach(loan => {
      if (loan.status !== 'Returned') {
        const due = new Date(loan.dueAt);
        const diff = due - now;
        if (diff > 0 && diff <= dueSoonThreshold) {
          const daysLeft = Math.ceil(diff / 86400000);
          const student = state.students.find(s => s.id === loan.studentId);
          const book = state.books.find(b => b.id === loan.bookId);
          alerts.push({
            id: 'alert_soon_' + loan.id,
            priority: 'High',
            title: `Due Soon (in ${daysLeft}d)`,
            message: `"${book?.title || 'Book'}" issued to ${student?.name || 'Student'} is due in ${daysLeft} days.`,
            createdAt: loan.issuedAt,
            read: false,
            type: 'due_soon'
          });
        }
      }
    });

    // 3. Low stock books
    const lowStockThreshold = state.settings.lowStockThreshold || 2;
    state.books.forEach(book => {
      if (book.availableCopies <= lowStockThreshold) {
        alerts.push({
          id: 'alert_stock_' + book.id,
          priority: book.availableCopies === 0 ? 'Critical' : 'Normal',
          title: book.availableCopies === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: `"${book.title}" has ${book.availableCopies} available copies remaining (Total: ${book.totalCopies}).`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'stock'
        });
      }
    });

    // 4. Pending reservations
    const pendingRes = state.reservations.filter(r => r.status === 'Pending');
    if (pendingRes.length > 0) {
      alerts.push({
        id: 'alert_pending_res',
        priority: 'Normal',
        title: 'Pending Reservations',
        message: `There are ${pendingRes.length} student reservation requests waiting for administrative review.`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'reservation'
      });
    }

    return alerts;
  }

  function getDashboardStats() {
    const state = loadState();
    const now = new Date();

    const totalStudents = state.students.length;
    const totalTitles = state.books.length;
    const totalCopies = state.books.reduce((acc, b) => acc + (Number(b.totalCopies) || 0), 0);
    const availableCopies = state.books.reduce((acc, b) => acc + (Number(b.availableCopies) || 0), 0);
    
    const activeLoans = state.loans.filter(l => l.status === 'Issued' || l.status === 'Return Requested').length;
    const overdueLoans = state.loans.filter(l => (l.status === 'Issued' || l.status === 'Return Requested') && new Date(l.dueAt) < now).length;
    const pendingReservations = state.reservations.filter(r => r.status === 'Pending').length;
    const returnRequests = state.loans.filter(l => l.status === 'Return Requested').length;

    const unpaidFines = state.fines.filter(f => f.status === 'Unpaid').reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
    const collectedFines = state.fines.filter(f => f.status === 'Paid').reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

    return {
      totalStudents,
      totalTitles,
      totalCopies,
      availableCopies,
      activeLoans,
      overdueLoans,
      pendingReservations,
      returnRequests,
      unpaidFines,
      collectedFines
    };
  }

  function resetDemoData() {
    const initial = getInitialState();
    saveState(initial);
    return initial;
  }

  return {
    getState,
    subscribe,
    setCurrentUser,
    getBooks,
    addBook,
    updateBook,
    deleteBook,
    getStudents,
    addStudent,
    getReservations,
    createReservation,
    updateReservationStatus,
    cancelReservation,
    getLoans,
    issueLoan,
    requestReturn,
    confirmReturn,
    getFines,
    payFine,
    getAlerts,
    getDashboardStats,
    resetDemoData
  };
})();
