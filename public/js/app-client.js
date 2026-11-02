/**
 * Main Client Application Logic for LibraryOS
 * Handles view routing, dynamic rendering, Chart.js integrations,
 * Public API imports, and interactive student/admin workflows.
 */

const App = (() => {
  let currentPortal = 'admin'; // 'admin' or 'student'
  let currentView = 'admin-dashboard';
  let studentSearchTimeout = null;
  let activeStudentCategory = 'All';
  let loanChartInstance = null;
  let categoryChartInstance = null;

  // Initialize Application
  function init() {
    // Subscribe to store updates
    LMSStore.subscribe(() => {
      render();
    });

    // Populate issue loan dropdowns
    updateIssueLoanForm();

    // Default due date to +14 days from today
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    const dateInput = document.getElementById('inputIssueDueDate');
    if (dateInput) {
      dateInput.value = defaultDue.toISOString().split('T')[0];
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    // Set initial active portal & view
    const state = LMSStore.getState();
    if (state.currentUser?.role === 'student') {
      switchPortal('student', false);
    } else {
      switchPortal('admin', false);
    }

    render();
  }

  // Navigation & Portal Switching
  function switchPortal(portal, triggerRender = true) {
    currentPortal = portal;
    const btnStudent = document.getElementById('btnStudentPortal');
    const btnAdmin = document.getElementById('btnAdminPortal');
    const adminNav = document.getElementById('adminNavGroup');
    const studentNav = document.getElementById('studentNavGroup');

    if (portal === 'student') {
      btnStudent.classList.add('active');
      btnAdmin.classList.remove('active');
      adminNav.style.display = 'none';
      studentNav.style.display = 'block';

      // Set active student if not already
      const state = LMSStore.getState();
      if (!state.currentUser || state.currentUser.role !== 'student') {
        const firstStudent = state.students[0];
        LMSStore.setCurrentUser(firstStudent);
      }
      navigate('student-dashboard', triggerRender);
    } else {
      btnAdmin.classList.add('active');
      btnStudent.classList.remove('active');
      adminNav.style.display = 'block';
      studentNav.style.display = 'none';

      LMSStore.setCurrentUser({
        id: 'admin_1',
        name: 'Library Administrator',
        email: 'admin@library.local',
        role: 'admin'
      });
      navigate('admin-dashboard', triggerRender);
    }
  }

  function navigate(viewName, triggerRender = true) {
    currentView = viewName;

    // Toggle view elements
    document.querySelectorAll('.app-view').forEach(el => {
      el.style.display = 'none';
    });
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.style.display = 'block';

    // Update active nav links
    document.querySelectorAll('.nav-link-item').forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (triggerRender) {
      render();
    }
  }

  function switchUser(userId) {
    const state = LMSStore.getState();
    if (userId.startsWith('admin')) {
      switchPortal('admin');
    } else {
      const student = state.students.find(s => s.id === userId);
      if (student) {
        LMSStore.setCurrentUser(student);
        switchPortal('student');
      }
    }
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Switched to ${LMSStore.getState().currentUser.name}`,
      showConfirmButton: false,
      timer: 2000
    });
  }

  // --- Dynamic View Renderers ---

  function render() {
    const state = LMSStore.getState();

    // Update user display in topbar
    const navUser = document.getElementById('navUserName');
    if (navUser && state.currentUser) {
      navUser.textContent = state.currentUser.name;
    }

    updateModeBadge();
    renderNotifications();

    if (currentView === 'admin-dashboard') renderAdminDashboard();
    else if (currentView === 'admin-books') renderAdminBooks();
    else if (currentView === 'admin-students') renderAdminStudents();
    else if (currentView === 'admin-reservations') renderAdminReservations();
    else if (currentView === 'admin-loans') renderAdminLoans();
    else if (currentView === 'admin-fines') renderAdminFines();
    else if (currentView === 'student-dashboard') renderStudentDashboard();
    else if (currentView === 'student-books') renderStudentBooks();
  }

  // 1. Render Admin Dashboard
  function renderAdminDashboard() {
    const stats = LMSStore.getDashboardStats();

    document.getElementById('statTotalStudents').textContent = stats.totalStudents;
    document.getElementById('statTotalTitles').textContent = stats.totalTitles;
    document.getElementById('statAvailableCopies').textContent = stats.availableCopies;
    document.getElementById('statActiveLoans').textContent = stats.activeLoans;
    document.getElementById('statPendingRes').textContent = stats.pendingReservations;
    document.getElementById('statOverdueLoans').textContent = stats.overdueLoans;
    document.getElementById('statUnpaidFines').textContent = `₹${stats.unpaidFines.toFixed(2)}`;
    document.getElementById('statCollectedFines').textContent = `₹${stats.collectedFines.toFixed(2)}`;

    // Render Alerts
    const alerts = LMSStore.getAlerts();
    const countBadge = document.getElementById('alertCountBadge');
    if (countBadge) countBadge.textContent = `${alerts.length} Active Notice${alerts.length === 1 ? '' : 's'}`;

    const alertsContainer = document.getElementById('adminAlertsList');
    if (alertsContainer) {
      if (!alerts.length) {
        alertsContainer.innerHTML = `
          <div class="empty-inline">
            <i class="ti ti-circle-check"></i>
            <div><strong>All records in order</strong><p>No overdue loans or critical inventory shortages.</p></div>
          </div>`;
      } else {
        alertsContainer.innerHTML = alerts.map(a => {
          const priorityClass = a.priority === 'Critical' ? 'priority-critical' : a.priority === 'High' ? 'priority-high' : 'priority-normal';
          const badgeClass = a.priority === 'Critical' ? 'bg-red-lt' : a.priority === 'High' ? 'bg-orange-lt' : 'bg-blue-lt';
          return `
            <article class="alert-row ${priorityClass}">
              <div class="priority-dot"></div>
              <div class="alert-copy">
                <div class="d-flex flex-wrap gap-2 align-items-center">
                  <strong>${escapeHtml(a.title)}</strong>
                  <span class="badge ${badgeClass}">${a.priority}</span>
                </div>
                <p>${escapeHtml(a.message)}</p>
                <small>${new Date(a.createdAt).toLocaleString()}</small>
              </div>
              <div class="alert-actions">
                ${a.type === 'overdue' ? `<button class="btn btn-sm btn-outline-primary" onclick="App.navigate('admin-loans')">View Loan</button>` : ''}
                ${a.type === 'reservation' ? `<button class="btn btn-sm btn-outline-primary" onclick="App.navigate('admin-reservations')">Review Queue</button>` : ''}
                ${a.type === 'stock' ? `<button class="btn btn-sm btn-outline-primary" onclick="App.navigate('admin-books')">Manage Stock</button>` : ''}
              </div>
            </article>`;
        }).join('');
      }
    }

    renderCharts();
  }

  // Render Charts
  function renderCharts() {
    const state = LMSStore.getState();

    // 1. Borrowing Activity (by category or months)
    const loanCtx = document.getElementById('loanChart');
    if (loanCtx) {
      if (loanChartInstance) loanChartInstance.destroy();

      loanChartInstance = new Chart(loanCtx, {
        type: 'line',
        data: {
          labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
          datasets: [{
            label: 'Books Issued',
            data: [14, 21, 18, 29, 35, 42, state.loans.length + 38],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#4f46e5',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Inventory Distribution Doughnut
    const catCtx = document.getElementById('categoryChart');
    if (catCtx) {
      if (categoryChartInstance) categoryChartInstance.destroy();

      const catCounts = {};
      state.books.forEach(b => {
        catCounts[b.category] = (catCounts[b.category] || 0) + (Number(b.totalCopies) || 1);
      });
      const labels = Object.keys(catCounts);
      const data = Object.values(catCounts);

      categoryChartInstance = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      });
    }
  }

  // 2. Render Admin Books
  function renderAdminBooks() {
    const books = LMSStore.getBooks();
    const filter = (document.getElementById('adminBookSearch')?.value || '').toLowerCase();
    const tbody = document.getElementById('adminBooksTableBody');
    if (!tbody) return;

    const filtered = books.filter(b => 
      b.title.toLowerCase().includes(filter) ||
      b.author.toLowerCase().includes(filter) ||
      b.category.toLowerCase().includes(filter) ||
      (b.isbn && b.isbn.includes(filter))
    );

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No books found matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(b => `
      <tr>
        <td style="width: 50px;">
          <img src="${b.coverUrl}" class="rounded" style="width: 36px; height: 50px; object-fit: cover;">
        </td>
        <td>
          <div class="fw-bold">${escapeHtml(b.title)}</div>
          <small class="text-muted">${escapeHtml(b.author)} · ${b.publishedYear || 'N/A'}</small>
        </td>
        <td><span class="badge bg-secondary-lt">${escapeHtml(b.category)}</span></td>
        <td><code>${escapeHtml(b.isbn || '—')}</code></td>
        <td>
          <span class="badge ${b.availableCopies === 0 ? 'bg-red-lt' : 'bg-green-lt'}">
            ${b.availableCopies} available
          </span>
        </td>
        <td>${b.totalCopies}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="App.editBookCopies('${b.id}')" title="Adjust Copies">
            <i class="ti ti-edit"></i> Copies
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="App.deleteBook('${b.id}')" title="Delete">
            <i class="ti ti-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function filterAdminBooks() {
    renderAdminBooks();
  }

  // 3. Render Admin Students
  function renderAdminStudents() {
    const state = LMSStore.getState();
    const filter = (document.getElementById('studentDirectorySearch')?.value || '').toLowerCase();
    const tbody = document.getElementById('adminStudentsTableBody');
    if (!tbody) return;

    const filtered = state.students.filter(s =>
      s.name.toLowerCase().includes(filter) ||
      s.email.toLowerCase().includes(filter) ||
      s.registrationNo.toLowerCase().includes(filter) ||
      s.department.toLowerCase().includes(filter)
    );

    tbody.innerHTML = filtered.map(s => {
      const activeLoans = state.loans.filter(l => l.studentId === s.id && l.status !== 'Returned').length;
      return `
        <tr>
          <td class="fw-bold">${escapeHtml(s.name)}</td>
          <td><code>${escapeHtml(s.registrationNo)}</code></td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.department)}</td>
          <td>${escapeHtml(s.year)}</td>
          <td>
            <span class="badge ${activeLoans > 0 ? 'bg-blue-lt' : 'bg-secondary-lt'}">${activeLoans} Book${activeLoans === 1 ? '' : 's'}</span>
          </td>
          <td><span class="badge bg-green-lt">Active</span></td>
        </tr>`;
    }).join('');
  }

  function filterStudentDirectory() {
    renderAdminStudents();
  }

  // 4. Render Admin Reservations
  function renderAdminReservations() {
    const reservations = LMSStore.getReservations();
    const tbody = document.getElementById('adminReservationsTableBody');
    if (!tbody) return;

    if (!reservations.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No reservation requests in queue.</td></tr>`;
      return;
    }

    tbody.innerHTML = reservations.map(r => `
      <tr>
        <td class="fw-bold">${escapeHtml(r.student?.name || 'Unknown')}</td>
        <td><code>${escapeHtml(r.student?.registrationNo || '—')}</code></td>
        <td>${escapeHtml(r.book?.title || 'Unknown Book')}</td>
        <td>${new Date(r.createdAt).toLocaleDateString()}</td>
        <td>
          <span class="badge ${(r.book?.availableCopies || 0) > 0 ? 'bg-green-lt' : 'bg-red-lt'}">
            ${r.book?.availableCopies || 0} left
          </span>
        </td>
        <td>
          <span class="badge ${r.status === 'Approved' ? 'bg-green-lt' : r.status === 'Rejected' ? 'bg-red-lt' : 'bg-yellow-lt'}">
            ${r.status}
          </span>
        </td>
        <td class="text-end">
          ${r.status === 'Pending' ? `
            <button class="btn btn-sm btn-primary me-1" onclick="App.approveReservation('${r.id}')">Approve</button>
            <button class="btn btn-sm btn-outline-danger" onclick="App.rejectReservation('${r.id}')">Reject</button>
          ` : `<small class="text-muted">Reviewed</small>`}
        </td>
      </tr>
    `).join('');
  }

  // 5. Render Admin Loans
  function renderAdminLoans() {
    const loans = LMSStore.getLoans();
    const tbody = document.getElementById('adminLoansTableBody');
    if (!tbody) return;

    const now = new Date();
    updateIssueLoanForm();

    tbody.innerHTML = loans.map(l => {
      const isReturned = l.status === 'Returned';
      const isOverdue = !isReturned && new Date(l.dueAt) < now;
      let badgeClass = 'bg-blue-lt';
      let statusText = l.status;

      if (isReturned) {
        badgeClass = 'bg-green-lt';
      } else if (l.status === 'Return Requested') {
        badgeClass = 'bg-orange-lt';
        statusText = 'Return Requested';
      } else if (isOverdue) {
        badgeClass = 'bg-red-lt';
        statusText = 'Overdue';
      }

      return `
        <tr>
          <td>
            <div class="fw-bold">${escapeHtml(l.student?.name || '—')}</div>
            <small class="text-muted">${escapeHtml(l.student?.registrationNo || '')}</small>
          </td>
          <td>${escapeHtml(l.book?.title || '—')}</td>
          <td>${new Date(l.issuedAt).toLocaleDateString()}</td>
          <td>
            <span class="${isOverdue ? 'text-danger fw-bold' : ''}">
              ${new Date(l.dueAt).toLocaleDateString()}
            </span>
          </td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
          <td class="text-end">
            ${!isReturned ? `
              <button class="btn btn-sm btn-primary" onclick="App.confirmReturn('${l.id}')">
                <i class="ti ti-check me-1"></i> Confirm Return
              </button>
            ` : `<small class="text-muted">Returned ${new Date(l.returnedAt).toLocaleDateString()}</small>`}
          </td>
        </tr>`;
    }).join('');
  }

  function updateIssueLoanForm() {
    const state = LMSStore.getState();
    const selectStudent = document.getElementById('selectIssueStudent');
    const selectBook = document.getElementById('selectIssueBook');

    if (selectStudent) {
      selectStudent.innerHTML = `<option value="">-- Choose Enrolled Student --</option>` +
        state.students.map(s => `<option value="${s.id}">${escapeHtml(s.registrationNo)} — ${escapeHtml(s.name)}</option>`).join('');
    }

    if (selectBook) {
      const availableBooks = state.books.filter(b => b.availableCopies > 0);
      selectBook.innerHTML = `<option value="">-- Choose Available Book --</option>` +
        availableBooks.map(b => `<option value="${b.id}">${escapeHtml(b.title)} (${b.availableCopies} available)</option>`).join('');
    }
  }

  // 6. Render Admin Fines
  function renderAdminFines() {
    const fines = LMSStore.getFines();
    const tbody = document.getElementById('adminFinesTableBody');
    if (!tbody) return;

    if (!fines.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No fine records registered.</td></tr>`;
      return;
    }

    tbody.innerHTML = fines.map(f => `
      <tr>
        <td class="fw-bold">${escapeHtml(f.student?.name || '—')}</td>
        <td><code>${escapeHtml(f.student?.registrationNo || '—')}</code></td>
        <td>${escapeHtml(f.bookTitle)}</td>
        <td>${f.overdueDays} day${f.overdueDays === 1 ? '' : 's'}</td>
        <td class="fw-bold text-danger">₹${Number(f.amount).toFixed(2)}</td>
        <td>
          <span class="badge ${f.status === 'Paid' ? 'bg-green-lt' : 'bg-red-lt'}">${f.status}</span>
        </td>
        <td><small class="text-muted">${escapeHtml(f.paymentReference || 'Pending')}</small></td>
        <td class="text-end">
          ${f.status === 'Unpaid' ? `
            <button class="btn btn-sm btn-primary" onclick="App.openPaymentModal('${f.id}')">
              <i class="ti ti-cash me-1"></i> Record Payment
            </button>
          ` : `<small class="text-success"><i class="ti ti-check"></i> Paid ${new Date(f.paidAt).toLocaleDateString()}</small>`}
        </td>
      </tr>
    `).join('');
  }

  // 7. Render Student Dashboard
  function renderStudentDashboard() {
    const state = LMSStore.getState();
    const student = state.currentUser;
    if (!student || student.role !== 'student') return;

    document.getElementById('studentWelcomeTitle').textContent = `Welcome, ${student.name}`;
    document.getElementById('studentWelcomeSubtitle').textContent = `${student.registrationNo} · ${student.department} (${student.year})`;

    const myLoans = state.loans.filter(l => l.studentId === student.id);
    const activeLoans = myLoans.filter(l => l.status !== 'Returned');
    const myRes = state.reservations.filter(r => r.studentId === student.id);
    const myFines = state.fines.filter(f => f.studentId === student.id);
    const unpaidTotal = myFines.filter(f => f.status === 'Unpaid').reduce((s, f) => s + f.amount, 0);

    document.getElementById('studentStatLoans').textContent = activeLoans.length;
    document.getElementById('studentStatReservations').textContent = myRes.filter(r => r.status === 'Pending').length;
    document.getElementById('studentStatFines').textContent = `₹${unpaidTotal.toFixed(2)}`;

    // Render Student Loans Table
    const loansBody = document.getElementById('studentLoansTableBody');
    if (loansBody) {
      if (!activeLoans.length) {
        loansBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">You have no active loans right now.</td></tr>`;
      } else {
        const now = new Date();
        loansBody.innerHTML = activeLoans.map(l => {
          const book = state.books.find(b => b.id === l.bookId);
          const isOverdue = new Date(l.dueAt) < now;
          return `
            <tr>
              <td>
                <div class="fw-bold">${escapeHtml(book?.title || 'Book')}</div>
                <small class="text-muted">${escapeHtml(book?.author || '')}</small>
              </td>
              <td>
                <span class="${isOverdue ? 'text-danger fw-bold' : ''}">
                  ${new Date(l.dueAt).toLocaleDateString()}
                </span>
                ${isOverdue ? `<small class="d-block text-danger">Overdue!</small>` : ''}
              </td>
              <td>
                <span class="badge ${l.status === 'Return Requested' ? 'bg-orange-lt' : isOverdue ? 'bg-red-lt' : 'bg-blue-lt'}">
                  ${l.status}
                </span>
              </td>
              <td class="text-end">
                ${l.status === 'Issued' ? `
                  <button class="btn btn-sm btn-outline-primary" onclick="App.requestReturn('${l.id}')">
                    Request Return
                  </button>
                ` : `<small class="text-muted">Return submitted</small>`}
              </td>
            </tr>`;
        }).join('');
      }
    }

    // Render Student Reservations List
    const resList = document.getElementById('studentReservationsList');
    if (resList) {
      if (!myRes.length) {
        resList.innerHTML = `<p class="text-muted small py-2">No active reservation requests.</p>`;
      } else {
        resList.innerHTML = myRes.map(r => {
          const book = state.books.find(b => b.id === r.bookId);
          return `
            <div class="mini-record">
              <div>
                <strong>${escapeHtml(book?.title || 'Book')}</strong>
                <small>Requested on ${new Date(r.createdAt).toLocaleDateString()}</small>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge ${r.status === 'Approved' ? 'bg-green-lt' : r.status === 'Rejected' ? 'bg-red-lt' : 'bg-yellow-lt'}">${r.status}</span>
                ${r.status === 'Pending' ? `
                  <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none" onclick="App.cancelReservation('${r.id}')" title="Cancel">✕</button>
                ` : ''}
              </div>
            </div>`;
        }).join('');
      }
    }

    // Render Student Fines List
    const finesList = document.getElementById('studentFinesList');
    if (finesList) {
      if (!myFines.length) {
        finesList.innerHTML = `<p class="text-success small py-2"><i class="ti ti-check me-1"></i>No fines on your record! All clear.</p>`;
      } else {
        finesList.innerHTML = myFines.map(f => `
          <div class="mini-record">
            <div>
              <strong>${escapeHtml(f.bookTitle)}</strong>
              <small>${f.overdueDays} days late · Rate ₹5/day</small>
            </div>
            <div class="text-end">
              <span class="fw-bold ${f.status === 'Unpaid' ? 'text-danger' : 'text-success'}">₹${f.amount.toFixed(2)}</span>
              <span class="badge ${f.status === 'Paid' ? 'bg-green-lt' : 'bg-red-lt'} ms-2">${f.status}</span>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // 8. Render Student Books (Live Public API Integration)
  function renderStudentBooks() {
    const books = LMSStore.getBooks();
    const query = (document.getElementById('studentSearchInput')?.value || '').toLowerCase();
    const container = document.getElementById('studentBookGrid');
    if (!container) return;

    let filtered = books;
    if (activeStudentCategory !== 'All') {
      filtered = filtered.filter(b => b.category.toLowerCase().includes(activeStudentCategory.toLowerCase()));
    }
    if (query) {
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        (b.isbn && b.isbn.includes(query))
      );
    }

    if (!filtered.length) {
      container.innerHTML = `
        <div class="col-12 empty-state">
          <i class="ti ti-book-off"></i>
          <h3>No matching books in current inventory</h3>
          <p>Try searching different keywords or search the Public API above.</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(b => {
      const isAvailable = b.availableCopies > 0;
      return `
        <article class="book-card shadow-sm">
          <div class="book-cover">
            <img src="${b.coverUrl}" alt="${escapeHtml(b.title)}" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'">
          </div>
          <div class="book-info">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="eyebrow">${escapeHtml(b.category)}</span>
              <span class="book-rating"><i class="ti ti-star-filled"></i> ${b.rating || '4.8'}</span>
            </div>
            <h3 class="text-truncate" title="${escapeHtml(b.title)}">${escapeHtml(b.title)}</h3>
            <p class="text-truncate">${escapeHtml(b.author)}</p>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
              <span class="small ${isAvailable ? 'text-success fw-bold' : 'text-danger'}">
                ${isAvailable ? `${b.availableCopies} available` : 'Out of Stock'}
              </span>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary" onclick="App.showBookDetail('${b.id}')">Details</button>
                ${isAvailable ? `
                  <button class="btn btn-sm btn-primary" onclick="App.reserveBook('${b.id}')">Reserve</button>
                ` : `
                  <button class="btn btn-sm btn-secondary" disabled>Unavailable</button>
                `}
              </div>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function handleStudentSearch() {
    clearTimeout(studentSearchTimeout);
    studentSearchTimeout = setTimeout(() => {
      renderStudentBooks();
    }, 250);
  }

  function handleStudentSearchBtn() {
    const q = document.getElementById('studentSearchInput')?.value;
    if (q && q.trim()) {
      // Trigger instant Public API search
      App.searchPublicAPI(q);
      App.navigate('admin-books');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Searching Open Library Public API...',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      renderStudentBooks();
    }
  }

  function filterStudentCategory(cat) {
    activeStudentCategory = cat;
    document.querySelectorAll('.category-pill').forEach(pill => {
      if (pill.textContent.trim() === cat || (cat === 'All' && pill.textContent.includes('All'))) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    renderStudentBooks();
  }

  // --- Public API Integration (Search & Import) ---

  async function searchPublicAPI(customQuery = null) {
    const input = document.getElementById('apiSearchInput');
    const query = customQuery || input?.value;
    if (!query || !query.trim()) {
      Swal.fire('Input Required', 'Please type a title, author, topic, or ISBN to search the Public API.', 'info');
      return;
    }

    const btn = document.getElementById('btnRunApiSearch');
    const resultsContainer = document.getElementById('apiSearchResults');
    const resultsGrid = document.getElementById('apiResultsGrid');
    const countLabel = document.getElementById('apiResultsCount');

    if (btn) btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Searching API...`;
    resultsContainer.style.display = 'block';
    resultsGrid.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Connecting to Open Library & Google Books Public APIs...</p>
      </div>`;

    try {
      const results = await PublicAPIService.search(query, 12);
      if (btn) btn.innerHTML = `<i class="ti ti-cloud-download me-1"></i> Search Public API`;

      if (!results || !results.length) {
        resultsGrid.innerHTML = `
          <div class="col-12 text-center py-4 text-muted">
            <p>No results returned from Public APIs for "${escapeHtml(query)}". Try another search phrase.</p>
          </div>`;
        return;
      }

      countLabel.textContent = `Found ${results.length} volumes from ${results[0].source || 'Public API'}`;
      
      // Store in memory for instant import
      window.lastApiResults = results;

      resultsGrid.innerHTML = results.map((book, idx) => `
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 shadow-sm border p-2">
            <div class="d-flex gap-3">
              <img src="${book.coverUrl}" class="rounded" style="width: 70px; height: 95px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'">
              <div class="flex-grow-1 min-w-0">
                <span class="public-api-source-tag">${escapeHtml(book.category)} · ${book.publishedYear}</span>
                <h5 class="fw-bold mb-1 text-truncate" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h5>
                <p class="small text-muted mb-2 text-truncate">${escapeHtml(book.author)}</p>
                <div class="d-flex align-items-center justify-content-between">
                  <small class="text-warning">★ ${book.rating}</small>
                  <button class="btn btn-sm btn-primary" onclick="App.importApiBook(${idx})">
                    <i class="ti ti-plus"></i> Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join('');

    } catch (err) {
      if (btn) btn.innerHTML = `<i class="ti ti-cloud-download me-1"></i> Search Public API`;
      resultsGrid.innerHTML = `
        <div class="col-12 text-center text-danger py-4">
          <i class="ti ti-alert-triangle fs-2"></i>
          <p class="mt-2">Public API connection notice: ${escapeHtml(err.message)}</p>
        </div>`;
    }
  }

  function importApiBook(resultIndex) {
    const book = window.lastApiResults?.[resultIndex];
    if (!book) return;

    Swal.fire({
      title: 'Import to Library',
      text: `Enter initial copies to add for "${book.title}":`,
      input: 'number',
      inputValue: 4,
      inputAttributes: { min: 1, max: 50 },
      showCancelButton: true,
      confirmButtonText: 'Import into Catalogue',
      confirmButtonColor: '#4f46e5'
    }).then(res => {
      if (res.isConfirmed && res.value) {
        LMSStore.addBook({
          ...book,
          totalCopies: Number(res.value),
          availableCopies: Number(res.value)
        });

        Swal.fire({
          icon: 'success',
          title: 'Book Imported!',
          text: `"${book.title}" added to inventory with ${res.value} copies.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  // --- Handlers & Actions ---

  function handleManualAddBook(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      author: form.author.value,
      isbn: form.isbn.value,
      category: form.category.value,
      totalCopies: Number(form.totalCopies.value),
      coverUrl: form.coverUrl.value
    };

    LMSStore.addBook(data);
    form.reset();
    Swal.fire({
      icon: 'success',
      title: 'Book Added',
      text: `"${data.title}" added to library inventory.`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  function deleteBook(bookId) {
    const book = LMSStore.getBooks().find(b => b.id === bookId);
    Swal.fire({
      title: 'Remove Book?',
      text: `Are you sure you want to delete "${book?.title}" from inventory?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete'
    }).then(r => {
      if (r.isConfirmed) {
        LMSStore.deleteBook(bookId);
        Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false });
      }
    });
  }

  function editBookCopies(bookId) {
    const book = LMSStore.getBooks().find(b => b.id === bookId);
    if (!book) return;

    Swal.fire({
      title: 'Adjust Book Copies',
      html: `Update total copies for <b>${escapeHtml(book.title)}</b> (Currently Total: ${book.totalCopies}, Available: ${book.availableCopies}):`,
      input: 'number',
      inputValue: book.totalCopies,
      inputAttributes: { min: 0 },
      showCancelButton: true,
      confirmButtonText: 'Update'
    }).then(res => {
      if (res.isConfirmed && res.value !== null) {
        const newTotal = Math.max(0, Number(res.value));
        const diff = newTotal - book.totalCopies;
        const newAvailable = Math.max(0, book.availableCopies + diff);
        LMSStore.updateBook(bookId, { totalCopies: newTotal, availableCopies: newAvailable });
        Swal.fire({ icon: 'success', title: 'Updated', timer: 1500, showConfirmButton: false });
      }
    });
  }

  function handleRegisterStudent(e) {
    e.preventDefault();
    const form = e.target;
    try {
      const student = LMSStore.addStudent({
        name: form.name.value,
        email: form.email.value,
        registrationNo: form.registrationNo.value,
        department: form.department.value,
        year: form.year.value
      });

      form.reset();
      Swal.fire({
        icon: 'success',
        title: 'Student Registered!',
        text: `${student.name} (${student.registrationNo}) enrolled successfully.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Registration Error', err.message, 'error');
    }
  }

  function handleIssueLoan(e) {
    e.preventDefault();
    const form = e.target;
    try {
      const loan = LMSStore.issueLoan(form.studentId.value, form.bookId.value, form.dueAt.value);
      Swal.fire({
        icon: 'success',
        title: 'Book Issued!',
        text: `Book successfully checked out. Due date: ${new Date(loan.dueAt).toLocaleDateString()}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Issue Error', err.message, 'error');
    }
  }

  function confirmReturn(loanId) {
    Swal.fire({
      title: 'Confirm Book Return?',
      text: 'Inventory copies will be updated and any overdue fine will be automatically computed.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirm Physical Return',
      confirmButtonColor: '#4f46e5'
    }).then(res => {
      if (res.isConfirmed) {
        const result = LMSStore.confirmReturn(loanId);
        if (result.overdueDays > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Return Complete with Fine',
            html: `The book was <b>${result.overdueDays} days overdue</b>.<br>A fine of <b class="text-danger">₹${result.fineGenerated.amount}</b> has been added to student records.`
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Book Returned On Time!',
            text: 'Inventory replenished with 0 fines.',
            timer: 2000,
            showConfirmButton: false
          });
        }
      }
    });
  }

  function approveReservation(resId) {
    try {
      LMSStore.updateReservationStatus(resId, 'Approved');
      Swal.fire({ icon: 'success', title: 'Reservation Approved', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  }

  function rejectReservation(resId) {
    try {
      LMSStore.updateReservationStatus(resId, 'Rejected');
      Swal.fire({ icon: 'info', title: 'Reservation Rejected', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  }

  function reserveBook(bookId) {
    const state = LMSStore.getState();
    const student = state.currentUser;
    if (!student || student.role !== 'student') {
      Swal.fire('Student Login Required', 'Switch to student portal to place a book reservation.', 'info');
      return;
    }

    try {
      LMSStore.createReservation(student.id, bookId);
      Swal.fire({
        icon: 'success',
        title: 'Reservation Placed!',
        text: 'Your request has been sent to library administration for review.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Cannot Reserve', err.message, 'warning');
    }
  }

  function cancelReservation(resId) {
    const student = LMSStore.getState().currentUser;
    LMSStore.cancelReservation(resId, student.id);
    Swal.fire({ icon: 'info', title: 'Reservation Cancelled', timer: 1500, showConfirmButton: false });
  }

  function requestReturn(loanId) {
    const student = LMSStore.getState().currentUser;
    try {
      LMSStore.requestReturn(loanId, student.id);
      Swal.fire({
        icon: 'success',
        title: 'Return Requested',
        text: 'Library admin will verify physical drop-off at circulation desk.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  }

  function openPaymentModal(fineId) {
    const fine = LMSStore.getFines().find(f => f.id === fineId);
    if (!fine) return;

    document.getElementById('payFineId').value = fine.id;
    document.getElementById('payStudentName').textContent = `${fine.student?.name} (${fine.student?.registrationNo})`;
    document.getElementById('payBookTitle').textContent = fine.bookTitle;
    document.getElementById('payFineAmount').textContent = `₹${Number(fine.amount).toFixed(2)}`;
    document.getElementById('payReceiptRef').value = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
  }

  function handleConfirmPayment(e) {
    e.preventDefault();
    const fineId = document.getElementById('payFineId').value;
    const ref = document.getElementById('payReceiptRef').value;

    try {
      LMSStore.payFine(fineId, ref);
      bootstrap.Modal.getInstance(document.getElementById('paymentModal'))?.hide();

      Swal.fire({
        icon: 'success',
        title: 'Payment Recorded!',
        html: `Fine cleared successfully.<br>Official Receipt: <b>${escapeHtml(ref)}</b>`,
        confirmButtonColor: '#4f46e5'
      });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  }

  function showBookDetail(bookId) {
    const book = LMSStore.getBooks().find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookFullTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = `by ${book.author}`;
    document.getElementById('modalBookCategory').textContent = book.category;
    document.getElementById('modalBookIsbn').textContent = book.isbn || '—';
    document.getElementById('modalBookYear').textContent = book.publishedYear || '—';
    document.getElementById('modalBookAvailable').textContent = `${book.availableCopies} of ${book.totalCopies} copies`;
    document.getElementById('modalBookRating').textContent = `★ ${book.rating || '4.8'} / 5.0`;
    document.getElementById('modalBookDesc').textContent = book.description || 'No detailed synopsis provided for this title.';
    
    const coverEl = document.getElementById('modalBookCover');
    coverEl.src = book.coverUrl;

    const actions = document.getElementById('modalBookActions');
    const isStudent = LMSStore.getState().currentUser?.role === 'student';
    if (isStudent && book.availableCopies > 0) {
      actions.innerHTML = `<button class="btn btn-primary" onclick="App.reserveBook('${book.id}'); bootstrap.Modal.getInstance(document.getElementById('bookDetailModal'))?.hide();">Reserve Book</button>`;
    } else {
      actions.innerHTML = `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>`;
    }

    const modal = new bootstrap.Modal(document.getElementById('bookDetailModal'));
    modal.show();
  }

  // Notifications
  function renderNotifications() {
    const state = LMSStore.getState();
    const userId = state.currentUser?.id;
    const badge = document.getElementById('notifBadge');
    const container = document.getElementById('notifItems');
    if (!container) return;

    const myNotifs = state.notifications.filter(n => !n.recipientId || n.recipientId === userId);
    const unreadCount = myNotifs.filter(n => !n.read).length;

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }

    if (!myNotifs.length) {
      container.innerHTML = `<div class="text-center text-muted py-3 small">No notifications yet.</div>`;
    } else {
      container.innerHTML = myNotifs.map(n => `
        <div class="p-2 border-bottom ${n.read ? 'opacity-75' : 'bg-light rounded'}">
          <div class="fw-bold small">${escapeHtml(n.title)}</div>
          <div class="small text-muted">${escapeHtml(n.message)}</div>
          <small class="text-secondary" style="font-size:10px;">${new Date(n.createdAt).toLocaleTimeString()}</small>
        </div>
      `).join('');
    }
  }

  function clearNotifications() {
    const state = LMSStore.getState();
    state.notifications.forEach(n => n.read = true);
    localStorage.setItem('lms_advanced_store_v2', JSON.stringify(state));
    renderNotifications();
  }

  function resetData() {
    Swal.fire({
      title: 'Reset to Sample Data?',
      text: 'This will restore sample books, active students, loans, and fines.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reset demo'
    }).then(res => {
      if (res.isConfirmed) {
        LMSStore.resetDemoData();
        Swal.fire({ icon: 'success', title: 'Data Reset Complete', timer: 1500, showConfirmButton: false });
      }
    });
  }

  // Mode and Backend Configuration
  function updateModeBadge() {
    const badge = document.getElementById('systemModeBadge');
    if (!badge) return;

    const mode = LMSStore.getMode();
    if (mode === 'FULL_DATABASE') {
      badge.innerHTML = `<span class="badge bg-green-lt px-2 py-1"><i class="ti ti-database me-1"></i> FULL DATABASE MODE (MongoDB & Redis Connected)</span>`;
    } else {
      badge.innerHTML = `<span class="badge bg-warning-lt px-2 py-1"><i class="ti ti-device-desktop me-1"></i> DEMO MODE (Client Storage)</span>`;
    }
  }

  function showBackendModal() {
    const input = document.getElementById('backendUrlInput');
    const tag = document.getElementById('modalModeTag');
    const exp = document.getElementById('modalModeExplanation');
    const mode = LMSStore.getMode();

    if (input) input.value = LMSStore.getBackendUrl() || '';
    if (tag) {
      if (mode === 'FULL_DATABASE') {
        tag.className = 'badge bg-success text-white';
        tag.textContent = 'FULL DATABASE MODE';
      } else {
        tag.className = 'badge bg-warning text-dark';
        tag.textContent = 'DEMO MODE';
      }
    }
    if (exp) {
      if (mode === 'FULL_DATABASE') {
        exp.textContent = `Connected to live backend at ${LMSStore.getBackendUrl()}. Serving dynamic queries from MongoDB Atlas & Redis.`;
      } else {
        exp.textContent = `Running in local demonstration mode. Data is stored in your browser storage. Connect your Render backend URL to enable real-time MongoDB queries.`;
      }
    }

    const modal = new bootstrap.Modal(document.getElementById('backendModal'));
    modal.show();
  }

  async function testAndSaveBackend() {
    const input = document.getElementById('backendUrlInput');
    const url = input?.value?.trim();
    if (!url) {
      Swal.fire('Input Required', 'Please enter your Render or local backend URL (e.g. https://your-backend.onrender.com).', 'info');
      return;
    }

    Swal.fire({
      title: 'Connecting to Backend...',
      text: `Testing /health on ${url}`,
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/health`);
      if (res.ok) {
        const data = await res.json();
        await LMSStore.setBackendUrl(url);
        bootstrap.Modal.getInstance(document.getElementById('backendModal'))?.hide();

        Swal.fire({
          icon: 'success',
          title: 'Connected to Full Database!',
          html: `Backend Status: <b>${data.status}</b><br>MongoDB: <b>${data.mongodb}</b><br>Redis: <b>${data.redis}</b>`,
          timer: 2500
        });
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (e) {
      Swal.fire('Connection Error', `Could not reach backend API at ${url}: ${e.message}. Ensure backend is running and CORS is configured.`, 'error');
    }
  }

  async function switchToDemoMode() {
    await LMSStore.setBackendUrl('');
    bootstrap.Modal.getInstance(document.getElementById('backendModal'))?.hide();
    Swal.fire({
      icon: 'info',
      title: 'Switched to Demo Mode',
      text: 'Using client-side storage with 50+ pre-seeded student and library records.',
      timer: 2000,
      showConfirmButton: false
    });
  }

  // Excel Export
  function exportExcel(type) {
    // If backend is active, use official server export download
    const mode = LMSStore.getMode();
    const backend = LMSStore.getBackendUrl();

    if (mode === 'FULL_DATABASE' && backend) {
      window.location.href = `${backend}/admin/excel/export/${type}`;
      return;
    }

    // Client-side SheetJS export
    if (typeof XLSX === 'undefined') {
      Swal.fire('Excel Library Loading', 'Please wait a moment while SheetJS initializes.', 'info');
      return;
    }

    const state = LMSStore.getState();
    const wb = XLSX.utils.book_new();

    if (type === 'all' || type === 'students') {
      const studentData = state.students.map(s => ({
        StudentID: s.studentId || s.id,
        RegisterNumber: s.registerNumber || s.registrationNo,
        FullName: s.fullName || s.name,
        Email: s.email,
        Department: s.department,
        Year: s.year || s.yearOfStudy,
        Section: s.section || 'A',
        Status: s.accountStatus || 'Active'
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentData), 'Students');
    }

    if (type === 'all' || type === 'books') {
      const bookData = state.books.map(b => ({
        CatalogCode: b.catalogCode || b.id,
        Title: b.title,
        Author: b.author,
        ISBN: b.isbn || '',
        Category: b.category,
        TotalCopies: b.totalCopies,
        AvailableCopies: b.availableCopies,
        Shelf: b.shelfLocation || 'Section A1',
        PublishedYear: b.publishedYear || ''
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bookData), 'Books');
    }

    if (type === 'all' || type === 'fines') {
      const fineData = state.fines.map(f => ({
        FineID: f.fineId || f.id,
        Book: f.bookTitle,
        OverdueDays: f.overdueDays,
        Amount: f.amount,
        PaidAmount: f.paidAmount || (f.status === 'Paid' ? f.amount : 0),
        Status: f.status,
        ReceiptRef: f.paymentReference || ''
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fineData), 'Fines');
    }

    const filename = `LibraryOS_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Exported ${filename}`,
      showConfirmButton: false,
      timer: 2000
    });
  }

  // Excel Import
  function handleExcelImport() {
    const fileInput = document.getElementById('excelFileInput');
    const file = fileInput?.files?.[0];
    if (!file) {
      Swal.fire('No File Selected', 'Please select an .xlsx or .xls workbook to import.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let insertedStudents = 0;
        let insertedBooks = 0;
        const errors = [];

        // 1. Process Students Worksheet
        if (workbook.SheetNames.includes('Students')) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Students']);
          rows.forEach((row, idx) => {
            if (!row.RegisterNumber || !row.FullName || !row.Email) {
              errors.push(`Students Row ${idx + 2}: Missing required RegisterNumber, FullName, or Email.`);
              return;
            }
            try {
              LMSStore.addStudent({
                registrationNo: String(row.RegisterNumber),
                name: String(row.FullName),
                email: String(row.Email),
                department: row.Department || 'Computer Science',
                year: row.Year || '1st Year'
              });
              insertedStudents++;
            } catch (err) {
              errors.push(`Students Row ${idx + 2}: ${err.message}`);
            }
          });
        }

        // 2. Process Books Worksheet
        if (workbook.SheetNames.includes('Books')) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Books']);
          rows.forEach((row, idx) => {
            if (!row.Title || !row.Author) {
              errors.push(`Books Row ${idx + 2}: Missing required Title or Author.`);
              return;
            }
            try {
              LMSStore.addBook({
                title: String(row.Title),
                author: String(row.Author),
                isbn: row.ISBN ? String(row.ISBN) : '—',
                category: row.Category || 'General',
                totalCopies: Number(row.TotalCopies) || 4
              });
              insertedBooks++;
            } catch (err) {
              errors.push(`Books Row ${idx + 2}: ${err.message}`);
            }
          });
        }

        const reportEl = document.getElementById('excelImportReport');
        const detailsEl = document.getElementById('excelReportDetails');
        if (reportEl && detailsEl) {
          reportEl.style.display = 'block';
          detailsEl.innerHTML = `
            <div class="alert alert-success">
              <strong>Import Completed:</strong> Added ${insertedStudents} student(s) and ${insertedBooks} book(s).
            </div>
            ${errors.length ? `
              <div class="alert alert-warning">
                <strong>Notices (${errors.length}):</strong>
                <ul class="mb-0 small">${errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}</ul>
              </div>
            ` : '<p class="text-success small"><i class="ti ti-check me-1"></i>All records validated cleanly with zero errors.</p>'}
          `;
        }

        fileInput.value = '';
        Swal.fire('Import Processed', `Added ${insertedStudents} students and ${insertedBooks} books.`, 'success');
      } catch (err) {
        Swal.fire('Import Failed', err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function waiveFine(fineId) {
    Swal.fire({
      title: 'Waive Overdue Fine',
      input: 'text',
      inputLabel: 'Reason for Waiver (Required for Audit)',
      inputPlaceholder: 'e.g. Approved medical leave or college sports absence',
      inputValidator: (val) => {
        if (!val || !val.trim()) return 'Waiver reason is required.';
      },
      showCancelButton: true,
      confirmButtonText: 'Authorize Waiver',
      confirmButtonColor: '#4f46e5'
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const state = LMSStore.getState();
        const f = state.fines.find(x => x.id === fineId);
        if (f) {
          f.status = 'Waived';
          f.waiverReason = res.value.trim();
          f.outstandingAmount = 0;
          localStorage.setItem('lms_advanced_store_v3', JSON.stringify(state));
          render();
          Swal.fire({ icon: 'success', title: 'Fine Waived', timer: 1500, showConfirmButton: false });
        }
      }
    });
  }

  function markBookDamaged(bookId) {
    const state = LMSStore.getState();
    const b = state.books.find(x => x.id === bookId);
    if (b) {
      b.bookStatus = 'Damaged';
      b.availableCopies = Math.max(0, b.availableCopies - 1);
      localStorage.setItem('lms_advanced_store_v3', JSON.stringify(state));
      render();
      Swal.fire('Book Marked Damaged', 'Available count decremented.', 'info');
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    switchPortal,
    navigate,
    switchUser,
    render,
    showBackendModal,
    testAndSaveBackend,
    switchToDemoMode,
    updateModeBadge,
    exportExcel,
    handleExcelImport,
    waiveFine,
    markBookDamaged,
    searchPublicAPI,
    importApiBook,
    handleManualAddBook,
    deleteBook,
    editBookCopies,
    handleRegisterStudent,
    handleIssueLoan,
    confirmReturn,
    approveReservation,
    rejectReservation,
    reserveBook,
    cancelReservation,
    requestReturn,
    openPaymentModal,
    handleConfirmPayment,
    showBookDetail,
    handleStudentSearch,
    handleStudentSearchBtn,
    filterStudentCategory,
    filterAdminBooks,
    filterStudentDirectory,
    clearNotifications,
    resetData
  };
})();

// Bootstrap app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

