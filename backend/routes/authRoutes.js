const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, resendOTP, addUPI, getUserDetails } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.put('/add-upi', auth, addUPI);
router.get('/user-details', auth, getUserDetails);

module.exports = router;
