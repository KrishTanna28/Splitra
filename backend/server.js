const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const cron = require('./cron/scheduler');
const reportRoutes = require('./routes/reportRoutes');
const reminders = require('./cron/reminderScheduler');
const cors = require('cors');

dotenv.config();

const app = express();
// Configure CORS to allow the deployed frontend and localhost in development.
const CLIENT_URL = process.env.CLIENT_URL || 'https://splitra.vercel.app';
const DEV_URL = 'http://localhost:3000';
const allowedOrigins = [CLIENT_URL];
if (process.env.NODE_ENV !== 'production') allowedOrigins.push(DEV_URL);

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true // allow cookies & headers like Authorization
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/expenses', expenseRoutes);
app.use('/balances', balanceRoutes);
app.use('/settlements', settlementRoutes);
app.use('/reports', reportRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
