const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addSettlement, getSettlements, generateMyUPIQRCode, addRecurringContribution, paymentReminder, getMyRecurringContributions, updateRecurringContribution, deleteRecurringContribution } = require('../controllers/settlementController');

router.get('/my-recurring', auth, getMyRecurringContributions);
router.get('/:id/upi-qr',auth, generateMyUPIQRCode);
router.post('/:groupId/add', auth, addSettlement);
router.get('/:groupId', auth, getSettlements);
router.post('/recurring', auth, addRecurringContribution);
router.post('/:groupId/payment-reminder', auth, paymentReminder);
router.put('/update-recurring/:id', auth, updateRecurringContribution)
router.patch('/update-recurring/:id', auth, updateRecurringContribution)
router.delete('/delete-recurring/:id', auth, deleteRecurringContribution)

module.exports = router;    
