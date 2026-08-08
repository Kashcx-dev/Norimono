const express = require('express');
const router = express.Router();
const { getWallet, addMoney } = require('../handlers/WalletHandler');
const { createOrder, verifyPayment } = require('../handlers/rajorHandler');

// GET /wallet
// Retrieves the current user's wallet information
router.get('/', getWallet);

// POST /wallet/add
// Adds money to the user's wallet
router.post('/add', addMoney);

// POST /wallet/create-order
// Create a Razorpay order
router.post('/create-order', createOrder);

// POST /wallet/verify-payment
// Verify Razorpay payment
router.post('/verify-payment', verifyPayment);

module.exports = router;
