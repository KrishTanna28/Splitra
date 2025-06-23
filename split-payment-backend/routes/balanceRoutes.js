const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getGroupBalances } = require('../controllers/balanceController');

router.get('/:groupId', auth, getGroupBalances);

module.exports = router;
