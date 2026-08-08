const express = require('express');
const router = express.Router();
const { getWallet } = require('../handlers/WalletHandler');

// GET /wallet
// Retrieves the current user's wallet information
router.get('/', getWallet);

module.exports = router;
