const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addSettlement, getSettlements, generateUPILink, generateUPIQRCode, addRecurringContribution } = require('../controllers/settlementController');


router.get('/upi-link', generateUPILink);
router.get('/upi-qr', generateUPIQRCode);
router.post('/add', auth, addSettlement);
router.get('/:groupId', auth, getSettlements);
router.post('/recurring', auth, addRecurringContribution);

module.exports = router;
