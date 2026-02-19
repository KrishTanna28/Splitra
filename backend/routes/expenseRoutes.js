const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');
const {
  addExpense,
  getGroupExpenses,
  deleteExpense,
  updateExpense,
  addComment,
  getComments,
  getExpenses,
  getTotalExpenses,
  getCommentCount,
  getExpenseShare,
  deleteComment
} = require('../controllers/expenseController');

// ── Specific named-segment routes FIRST (before wildcard :param routes) ──
router.post('/:groupId/add', auth, upload.single('receipt'), addExpense);
router.put('/:groupId/:expenseId', auth, upload.single('receipt'), updateExpense);
router.get('/:groupId/total-expenses', auth, getTotalExpenses);
router.get('/:groupId/expenses', auth, getExpenses);
router.get('/comment-count/:expenseId', getCommentCount);
router.get('/:expenseId/comments', auth, getComments);
router.get('/:expenseId/share', auth, getExpenseShare);
router.post('/:expenseId/comment', auth, addComment);

// ── Broad wildcard routes LAST ──
router.get('/:groupId', auth, getGroupExpenses);
router.delete('/:expenseId/:commentId', auth, deleteComment);
router.delete('/:expenseId', auth, deleteExpense);

module.exports = router;
