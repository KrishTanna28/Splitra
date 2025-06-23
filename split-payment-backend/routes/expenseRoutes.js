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
  getComments
} = require('../controllers/expenseController');

router.post('/add', auth, upload.single('receipt'), addExpense);
router.get('/:groupId', auth, getGroupExpenses);
router.delete('/:expenseId', auth, deleteExpense);
router.put('/:expenseId', auth, updateExpense);
router.post('/:expenseId/comment', auth, addComment);
router.get('/:expenseId/comments', auth, getComments);


module.exports = router;
