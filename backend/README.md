# Split Payment App - Backend

## Overview

The Split Payment App backend is a Node.js/Express server that enables users to manage group expenses, split bills, track balances, and settle up efficiently. It supports group management, expense tracking, settlements (including UPI QR code generation), reporting, and automated reminders with OTP-based authentication.

---

## Features

- **OTP-Based Authentication**: Secure registration and login with email OTP verification
- **Group Management**: Create groups, add/remove members, and manage group roles
- **Expense Tracking**: Add expenses, split among members, upload receipts, and enforce group budgets
- **Balance Calculation**: Real-time calculation and optimization of who owes whom
- **Settlements**: Record payments, generate UPI QR codes, and handle recurring contributions
- **Reports**: Export expenses as CSV or PDF, and view monthly summaries
- **Notifications & Reminders**: Email notifications for expenses, reminders for dues, and scheduled recurring contributions
- **File Uploads**: Upload and store receipts securely

---

## Architecture Overview

Your Split Payment App is a **Node.js/Express REST API** with **PostgreSQL** database, designed for group expense management with advanced features like OTP authentication, automated reminders, and settlement optimization.

---

## Database Schema

### Core Tables:

1. **`users`**
   - `id` (Primary Key)
   - `name`, `email`, `password` (hashed)
   - `upi_id` (for QR code payments)

2. **`groups`**
   - `id`, `name`, `description`
   - `created_by_id`, `created_by`

3. **`group_members`**
   - `group_id`, `user_id`, `role` (Admin/Member)

4. **`expenses`**
   - `id`, `group_id`, `amount`, `category`, `description`
   - `paid_by` (string name), `paid_by_id` (user ID)
   - `receipt_url`, `created_at`

5. **`expense_shares`**
   - `expense_id`, `user_id`, `amount` (individual share)

6. **`settlements`**
   - `group_id`, `paid_by`, `paid_to`, `amount`, `note`

7. **`recurring_contributions`**
   - `group_id`, `user_id`, `amount`, `frequency`
   - `start_date`, `description`, `category`, `active`

8. **`otp_codes`** (For OTP authentication)
   - `email`, `otp`, `expires_at`, `created_at`

9. **`group_budgets`**
   - `group_id`, `monthly_limit`, `active`

10. **`expense_comments`**
    - `expense_id`, `user_id`, `comment`, `emoji`

---

## Project Structure

```
split-payment-backend/
  config/           # Database configuration
  controllers/      # Business logic for each module
  cron/             # Scheduled jobs (reminders, recurring expenses)
  middleware/       # Auth, error handling, file uploads
  routes/           # API endpoints
  utils/            # Helper functions (mailer, optimizer)
  uploads/          # Uploaded receipts
  package.json      # Project metadata and dependencies
  server.js         # Entry point
```

---

## Tech Stack

- **Node.js** (Express)
- **PostgreSQL**
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for emails
- **node-cron** for scheduled jobs
- **PDFKit**, **json2csv** for reports
- **qrcode** for UPI QR code generation
- **bcrypt** for password hashing

---

## API Routes Structure

### Base URL: `http://localhost:5000`

### 1. Authentication Routes (`/auth`)
```javascript
POST /auth/register          // Register new user
POST /auth/login            // Login (sends OTP)
POST /auth/verify-otp      // Verify OTP for login
POST /auth/resend-otp      // Resend OTP
```

### 2. Group Management (`/groups`)
```javascript
POST /groups/create         // Create new group
GET /groups/               // List user's groups
POST /groups/:id/add-member    // Add member
POST /groups/:id/remove-member // Remove member
```

### 3. Expense Management (`/expenses`)
```javascript
POST /expenses/:groupId/add     // Add expense with receipt
GET /expenses/:groupId          // List group expenses
DELETE /expenses/:expenseId     // Delete expense
PUT /expenses/:groupId/:expenseId // Update expense
POST /expenses/:expenseId/comment // Add comment
GET /expenses/:expenseId/comments // Get comments
```

### 4. Balance & Settlements (`/balances`, `/settlements`)
```javascript
GET /balances/:groupId          // Get optimized balances
POST /settlements/:groupId/add  // Record settlement
GET /settlements/:groupId       // List settlements
GET /settlements/upi/:userId    // Generate UPI QR
```

### 5. Reports (`/reports`)
```javascript
GET /reports/summary           // Monthly summary
GET /reports/:groupId/csv      // Export CSV
GET /reports/:groupId/pdf      // Export PDF
```

---

## Authentication Flow

### OTP-Based Login Process:

1. **Step 1: Initial Login**
   ```javascript
   POST /auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
   **Response:**
   ```json
   {
     "message": "OTP sent to your email",
     "email": "user@example.com",
     "requiresOTP": true
   }
   ```

2. **Step 2: OTP Verification**
   ```javascript
   POST /auth/verify-otp
   {
     "email": "user@example.com",
     "otp": "123456"
   }
   ```
   **Response:**
   ```json
   {
     "message": "Login successful",
     "token": "jwt_token_here",
     "user": { "id": 1, "name": "John", "email": "..." }
   }
   ```

3. **JWT Token Usage**
   ```javascript
   Authorization: Bearer jwt_token_here
   ```

---

## Expense Management Flow

### Adding an Expense:

1. **Upload Receipt** (optional)
2. **Split Among Members**
3. **Budget Check** (if enabled)
4. **Email Notifications** to all members
5. **Balance Recalculation**

```javascript
POST /expenses/:groupId/add
Content-Type: multipart/form-data

{
  "data": {
    "amount": 1000,
    "category": "Food",
    "description": "Dinner",
    "splits": [
      {"userId": 1, "amount": 250},
      {"userId": 2, "amount": 250},
      {"userId": 3, "amount": 250},
      {"userId": 4, "amount": 250}
    ]
  },
  "receipt": [file]
}
```

---

## Balance Calculation Algorithm

### Net Balance Formula:
```
Net Balance = Total Paid - Total Owed + Settlements
```

### Optimization Algorithm:
1. **Separate debtors** (negative balance) and **creditors** (positive balance)
2. **Match debtors with creditors** to minimize transactions
3. **Calculate optimal settlement amounts**
4. **Return simplified transaction list**

**Example:**
- User A owes ₹500
- User B owes ₹300  
- User C is owed ₹800
- **Optimized Result:** A pays C ₹500, B pays C ₹300

---

## Email System

### Email Templates:
1. **OTP Emails** - Login verification
2. **Expense Notifications** - New/updated expenses
3. **Daily Reminders** - Unpaid balances
4. **Recurring Contribution** - Automated expenses

### Email Configuration:
```javascript
// utils/mailer.js
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

---

## Scheduled Jobs (Cron)

### 1. Daily Reminders (`cron/reminderScheduler.js`)
- **Schedule:** Every day at 8 AM
- **Purpose:** Send email reminders for unpaid balances
- **Query:** Finds users who owe money in groups

### 2. Recurring Expenses (`cron/scheduler.js`)
- **Schedule:** Every day at midnight
- **Purpose:** Automatically add recurring expenses (rent, utilities)
- **Features:** Supports monthly, weekly, daily frequencies

---

## Report Generation

### 1. CSV Export
- **Format:** Standard CSV with expense details
- **Headers:** ID, Paid By, Amount, Category, Description, Date

### 2. PDF Export (Enhanced)
- **Professional Layout:** Header, summary, table, footer
- **Features:** 
  - Group name in filename
  - Total calculations
  - Pagination for long lists
  - Professional styling

### 3. Monthly Summary
- **Top contributors** by amount paid
- **Total spending** for the month
- **Filtered by group, month, year**

---

## Middleware Stack

### 1. Authentication Middleware (`middleware/auth.js`)
```javascript
// Validates JWT token
const token = req.header('Authorization')?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
```

### 2. File Upload Middleware (`middleware/multer.js`)
```javascript
// Handles receipt uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: uniqueSuffix + extension
});
```

### 3. Error Handler (`middleware/errorHandler.js`)
```javascript
// Centralized error handling
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
};
```

---

## Security Features

### 1. Password Security
- **bcrypt hashing** with salt rounds of 10
- **Email uniqueness** validation

### 2. OTP Security
- **6-digit random OTPs**
- **1-minute expiration**
- **Single-use tokens** (deleted after use)

### 3. JWT Security
- **7-day expiration**
- **User ID in payload**
- **Secret key protection**

### 4. File Upload Security
- **File type validation** (.png, .jpg, .jpeg, .pdf)
- **Unique filename generation**
- **Size limits** (implicit)

---

## Data Flow Examples

### Complete Expense Flow:
1. **User uploads receipt** → Multer saves to `uploads/`
2. **Expense data** → Inserted into `expenses` table
3. **Splits calculated** → Inserted into `expense_shares`
4. **Budget checked** → Warns if exceeded
5. **Emails sent** → All members notified
6. **Balances updated** → Real-time calculation

### Settlement Flow:
1. **User records payment** → Inserted into `settlements`
2. **Balance recalculated** → Net amounts updated
3. **Optimization applied** → Minimal transactions suggested
4. **QR code generated** → UPI payment link

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- PostgreSQL database
- Gmail account for sending emails (or configure another SMTP provider)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd split-payment-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root with the following:
   ```
   PORT=5000
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=your_db_name
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_gmail_address
   EMAIL_PASS=your_gmail_app_password
   ```

4. **Create database tables:**
   ```sql
   -- Create OTP codes table for temporary storage of login OTPs
   CREATE TABLE IF NOT EXISTS otp_codes (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) NOT NULL,
       otp VARCHAR(6) NOT NULL,
       expires_at TIMESTAMP NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Create index for faster lookups
   CREATE INDEX IF NOT EXISTS idx_otp_codes_email_otp ON otp_codes(email, otp);
   CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

---

## Performance Optimizations

### 1. Database Indexes
- **OTP lookups** by email and expiration
- **Expense queries** by group and date
- **User authentication** by email

### 2. Query Optimization
- **JOIN operations** for related data
- **Aggregation queries** for totals
- **Parameterized queries** for security

### 3. File Handling
- **Streaming responses** for large files
- **Async operations** for email sending
- **Error handling** for failed uploads

---

## Error Handling Strategy

### 1. Database Errors
- **Connection failures** → Graceful degradation
- **Constraint violations** → User-friendly messages
- **Transaction rollbacks** → Data consistency

### 2. File Upload Errors
- **Invalid file types** → Rejected with message
- **Storage failures** → Error logged, user notified
- **Size limits** → Automatic rejection

### 3. Email Errors
- **SMTP failures** → Logged, app continues
- **Invalid addresses** → Graceful handling
- **Rate limiting** → Queued processing

---

## Scalability Considerations

### 1. Database
- **Connection pooling** for multiple requests
- **Indexed queries** for performance
- **Normalized schema** for data integrity

### 2. File Storage
- **Local storage** (can be moved to cloud)
- **Unique filenames** prevent conflicts
- **Cleanup procedures** for old files

### 3. Email System
- **Async processing** for non-blocking
- **Error handling** for reliability
- **Template system** for consistency

---

## Testing in Postman

### Authentication Flow:
1. **Register**: `POST /auth/register`
2. **Login**: `POST /auth/login` (gets OTP)
3. **Verify OTP**: `POST /auth/verify-otp`
4. **Use JWT**: Add `Authorization: Bearer <token>` header

### Example Requests:
```bash
# Register
POST http://localhost:5000/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "upi_id": "john@upi"
}

# Login
POST http://localhost:5000/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Verify OTP
POST http://localhost:5000/auth/verify-otp
{
  "email": "john@example.com",
  "otp": "123456"
}
```

---

## Contribution

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/foo`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

This project is licensed under the ISC License.

---

## Acknowledgements

- Inspired by Splitwise and similar expense-sharing apps.
- Built with Node.js, Express, and PostgreSQL. 