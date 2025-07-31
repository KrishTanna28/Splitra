const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  exportExpensesCSV,
  exportExpensesPDF,
  getMonthlySummary,
  getExpenseInsights
} = require('../controllers/reportController');

router.get('/export/:groupId/csv', auth, exportExpensesCSV);
router.get('/export/:groupId/pdf', auth, exportExpensesPDF);
router.get('/summary', auth, getMonthlySummary);
router.get('/insights', auth, getExpenseInsights);

module.exports = router;
