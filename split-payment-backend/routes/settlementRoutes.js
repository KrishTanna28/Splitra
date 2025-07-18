const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addSettlement, getSettlements, generateUPIQRCode, addRecurringContribution } = require('../controllers/settlementController');

router.get('/:id/upi-qr',auth, generateUPIQRCode);
router.post('/:groupId/add', auth, addSettlement);
router.get('/:groupId', auth, getSettlements);
router.post('/:groupId/recurring', auth, addRecurringContribution);

module.exports = router;
