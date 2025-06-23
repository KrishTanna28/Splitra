const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getMonthlySummary,
  exportExpensesCSV,
  exportExpensesPDF
} = require('../controllers/reportController');

router.get('/summary', auth, getMonthlySummary);
router.get('/export/:groupId/csv', auth, exportExpensesCSV);
router.get('/export/:groupId/pdf', auth, exportExpensesPDF);

module.exports = router;
