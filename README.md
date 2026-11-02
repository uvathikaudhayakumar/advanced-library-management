# Advanced Library Book Reservation & Fine Management System

A full-featured Library Management System (LMS) with separate Student and Admin portals, live **Public APIs** integration (Open Library API & Google Books API), automatic overdue fine calculations, interactive Chart.js analytics, and complete **Netlify** deployment readiness.

---

## 🌟 Key Features

### 🌐 Public APIs Integration
- **Open Library Public API (`https://openlibrary.org`)**: Live search across millions of books worldwide by title, author, subject, or ISBN.
- **Google Books Public API (`https://www.googleapis.com/books/v1`)**: Automatic secondary fallback for metadata enrichment and cover thumbnails.
- **1-Click Admin Import**: Search any academic or general volume from the Public API and instantly import it into library inventory with customized copy counts.
- **Pre-populated Curriculum Collection**: Pre-seeded with core Computer Science, AI, Algorithms, Database Systems, and Cloud volumes.

### 🎓 Student Portal
- **Live Catalogue Search & Category Filtering**: Browse real volumes by category (Computer Science, AI, Web Dev, Networking, etc.) or live search.
- **One-Click Book Reservation**: Reserve available copies with automatic stock checking (limit 3 pending requests).
- **Student Dashboard**:
  - **Active Loans Table**: Real-time due date countdowns, status badges (*On Time*, *Due Soon*, *Overdue*).
  - **Request Return**: Notify administration for physical return drop-off.
  - **My Reservations**: Track request approvals or cancel pending requests.
  - **My Fines**: Itemized late fees calculated automatically per overdue day.
  - **Notifications**: Instant updates on approvals, returns, and notices.

### 🛡️ Admin Portal
- **Overview Dashboard**:
  - 8 real-time KPI metrics (Students, Titles, Total Copies, Available Copies, Active Loans, Overdue, Unpaid Fines, Collected Fines).
  - **Priority Alert Centre**: Automated alerts for overdue loans, due-soon items (< 3 days), low inventory (< 2 copies), and pending reservations.
  - **Chart.js Visualizations**: Monthly borrowing trend line chart and subject distribution doughnut chart.
- **Book Management**:
  - Live Public API search & import.
  - Add custom books with custom cover URLs.
  - Edit available/total copies and remove outdated volumes.
- **Student Management**:
  - Register new students (Name, Email, Registration Number, Department, Year, Password).
  - Comprehensive student directory with active loan counts and account status.
- **Reservations Queue**:
  - Review student reservation requests with instant **Approve** or **Reject** actions.
- **Issue & Return Desk**:
  - Issue books to enrolled students with custom due dates (defaults to +14 days).
  - Confirm physical book return: automatically replenishes inventory stock and computes overdue fines if late.
- **Fine Management**:
  - Audit outstanding fines.
  - Record payments with official receipt / reference numbers.

---

## 🚀 Live Deployment on Netlify

This project is fully configured for continuous deployment on [Netlify](https://www.netlify.com).

### Automatic Deployment via GitHub (Recommended)
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log in to [Netlify App](https://app.netlify.com).
3. Click **Add new site** > **Import an existing project**.
4. Select **GitHub** and choose `uvathikaudhayakumar/advanced-library-management`.
5. Netlify will automatically detect `netlify.toml`:
   - **Publish directory**: `public`
   - **Build command**: `echo 'Netlify build successful'`
6. Click **Deploy advanced-library-management**. Your site will be live on HTTPS with a custom `*.netlify.app` URL!

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  publish = "public"
  command = "echo 'Netlify build successful'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 💻 Local Development Setup (Node.js & Express)

If you wish to run the Node.js Express server locally:

### 1. Requirements
- Node.js 18+
- MongoDB Community Server or MongoDB Atlas (optional for client-side mode)

### 2. Installation
```bash
git clone https://github.com/uvathikaudhayakumar/advanced-library-management.git
cd advanced-library-management
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```
Configure your `.env` variables:
```ini
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/advanced_library
SESSION_SECRET=your_secure_random_session_secret
ADMIN_NAME=Library Administrator
ADMIN_EMAIL=admin@library.local
ADMIN_PASSWORD=ChangeMe123!
FINE_PER_DAY=5
DUE_SOON_DAYS=3
LOW_STOCK_THRESHOLD=2
```

### 4. Seed First Admin Account & Run
```bash
npm run seed
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Configurable Parameters
- `FINE_PER_DAY`: Overdue fine amount per day (default: ₹5.00).
- `DUE_SOON_DAYS`: Threshold days before due date to raise priority alert (default: 3 days).
- `LOW_STOCK_THRESHOLD`: Available copies threshold for inventory warning (default: 2 copies).

---

## 🛡️ License & Academic Starter
Built for educational and institutional library management demonstration.
Licensed under the ISC License.
