const express = require("express");
const router = express.Router();

// Chat routes will go here
router.get("/", (req, res) => {
    res.json({ message: "Chat API ready" });
});

module.exports = router;
