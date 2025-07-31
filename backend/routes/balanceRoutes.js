const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getGroupBalances, getMyBalances } = require('../controllers/balanceController');

router.get('/:groupId/my-balances', auth, getMyBalances);
router.get('/:groupId', auth, getGroupBalances);

module.exports = router;
