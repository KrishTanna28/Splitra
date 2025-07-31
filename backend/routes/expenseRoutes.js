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

router.post('/:groupId/add', auth, upload.single('receipt'), addExpense);
router.get('/:groupId', auth, getGroupExpenses);
router.delete('/:expenseId', auth, deleteExpense);
router.put('/:groupId/:expenseId', auth, upload.single('receipt'), updateExpense);
router.post('/:expenseId/comment', auth, addComment);
router.get('/:expenseId/comments', auth, getComments);
router.get('/:groupId/expenses', auth, getExpenses);
router.get('/:groupId/total-expenses', auth, getTotalExpenses);
router.get("/comment-count/:expenseId", getCommentCount);
router.get('/:expenseId/share', auth, getExpenseShare);
router.delete('/:expenseId/:commentId', auth, deleteComment);

module.exports = router;
