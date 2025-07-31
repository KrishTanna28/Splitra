const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, resendOTP, updateProfile, getUserDetails } = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.put('/update-profile', auth, upload.single('profile_picture'), updateProfile);
router.get('/user-details', auth, getUserDetails);

module.exports = router;
