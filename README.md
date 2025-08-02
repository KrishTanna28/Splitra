# Splitra

A comprehensive web application for managing shared expenses and splitting bills among groups. Built with a React.js frontend and Node.js backend, featuring smart assignment logic, email notifications, and robust expense tracking.

🔗 **Live Website**: [https://splitra.vercel.app](https://splitra.vercel.app)

## 🚀 Features

### 👥 Group Management
- **Create and manage groups** for different expense categories (trips, household, business)
- **Add/remove members** via email invitations
- **Email notifications** when members join

### 💸 Expense Tracking
- **Add expenses** with categories, amounts, and descriptions
- **Receipt upload** with image storage (Cloudinary)
- **Flexible expense splitting** (equal, custom amounts, percentages)
- **Expense comments** with emoji reactions
- **Edit/delete expenses** with proper permissions

### ⚖️ Balance Management
- **Automatic balance calculation** based on expenses and settlements
- **Individual balances** per group member
- **Visual balance indicators** (positive/negative amounts)

### 💳 Settlement System
- **Record settlements** between members
- **Payment reminders** via email
- **Settlement history** tracking
- **QR code generation** for UPI payments
- **Payment status tracking**

### 📊 Reporting & Analytics
- **Comprehensive expense reports** with charts and graphs
- **Export functionality** (CSV/PDF formats)
- **Group activity summaries**
- **Financial insights** per group and member
- **Spending pattern analysis**

### 🔄 Recurring Contributions
- **Scheduled payments** (weekly/monthly)
- **Automated expense creation**
- **Reminder system** for recurring payments
- **Flexible frequency settings**

### 🔐 Security & Authentication
- **JWT-based authentication**
- **Email verification** with OTP
- **Password hashing** with bcrypt
- **Protected routes** and API endpoints
- **Input validation** and sanitization

## 🛠️ Tech Stack

### Frontend
- **React.js 19.1.0** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **Context API** - State management
- **Chart.js & Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Modern icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Image storage
- **Nodemailer** - Email services
- **Node-cron** - Scheduled tasks
- **PDFKit** - PDF generation
- **QRCode** - QR code generation

### Development Tools
- **Nodemon** - Development server
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variables

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Cloudinary** account (for image storage)
- **Email service** (Gmail, etc.)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/KrishTanna28/Splitra.git
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=split_payment_db
DB_PASSWORD=your_db_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 4. Database Setup

Create a PostgreSQL database and run the following SQL commands:

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    upi_id VARCHAR(255),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by_id INTEGER REFERENCES users(id),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members table
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    paid_by_id INTEGER REFERENCES users(id),
    paid_by VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense shares table
CREATE TABLE expense_shares (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense comments table
CREATE TABLE expense_comments (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    comment TEXT,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settlements table
CREATE TABLE settlements (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    paid_by INTEGER REFERENCES users(id),
    paid_to INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring contributions table
CREATE TABLE recurring_contributions (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP codes table
CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Start the Application

#### Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

#### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

## 📱 Usage Guide

### 1. Getting Started

1. **Register/Login**: Create an account or login with existing credentials
2. **Email Verification**: Verify your email with the OTP sent to your inbox
3. **Dashboard**: Access your main dashboard with group overview

### 2. Creating Groups

1. Click "Create Group" on the dashboard
2. Enter group name and description
3. Add members by email addresses
4. Members will receive email invitations

### 3. Adding Expenses

1. Navigate to a group
2. Go to the "Expenses" tab
3. Click "Add Expense"
4. Fill in expense details:
   - Amount
   - Description
   - Category
   - Receipt (optional)
   - Split method (equal, custom, percentage)
5. Save the expense

### 4. Managing Balances

1. View balances in the "Balances" tab
2. See who owes money and who is owed
3. Record settlements when payments are made
4. Send payment reminders to members

### 5. Generating Reports

1. Go to the "Reports" tab
2. Select date range and filters
3. View comprehensive expense analytics
4. Export reports in CSV or PDF format

## 🔧 API Documentation

### Authentication Endpoints

```
POST /auth/register - Register new user
POST /auth/login - Login user
POST /auth/verify-otp - Verify OTP
GET /auth/user-details - Get user details
```

### Group Endpoints

```
POST /groups - Create new group
GET /groups/my-groups - Get user's groups
POST /groups/:groupId/add-member - Add member to group
DELETE /groups/:groupId/remove-member - Remove member from group
GET /groups/:groupId/members - Get group members
```

### Expense Endpoints

```
POST /expenses/:groupId/add - Add new expense
GET /expenses/:groupId/expenses - Get group expenses
PUT /expenses/:groupId/:expenseId - Update expense
DELETE /expenses/:expenseId - Delete expense
POST /expenses/:expenseId/comment - Add comment to expense
GET /expenses/:expenseId/comments - Get expense comments
```

### Balance Endpoints

```
GET /balances/:groupId - Get group balances
GET /balances/:groupId/my-balances - Get user's balances
```

### Settlement Endpoints

```
POST /settlements/:groupId - Add settlement
GET /settlements/:groupId - Get group settlements
POST /settlements/:groupId/payment-reminder - Send payment reminder
```

## 🎨 Customization

### Styling

The application uses CSS modules and custom CSS. Main style files are located in:
- `frontend/src/styles/` - Global styles and themes
- Component-specific styles in each component directory

### Themes

The app supports dark and light themes. Theme configuration is in:
- `frontend/src/context/ThemeContext.js`
- `frontend/src/styles/themes.css`

### Adding New Features

1. **Backend**: Add new routes in `backend/routes/` and controllers in `backend/controllers/`
2. **Frontend**: Create new components in `frontend/src/components/` and pages in `frontend/src/pages/`
3. **Database**: Add new tables and update existing schemas as needed

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Email Not Sending**
   - Verify email credentials in `.env`
   - Check email service settings
   - Ensure proper SMTP configuration

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file types

4. **CORS Errors**
   - Update CORS_ORIGIN in backend `.env`
   - Ensure frontend URL is correct

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use consistent indentation (2 spaces)
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React.js** team for the amazing framework
- **Express.js** community for the robust backend framework
- **PostgreSQL** for the reliable database
- **Cloudinary** for image storage services

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: teamsplitra@gmail.com

---
