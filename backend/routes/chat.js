const express = require("express");
const router = express.Router();
const { getBotAnswer } = require("./getAiAnswer");

// Chat routes
router.get("/", (req, res) => {
    res.json({ message: "Chat API ready" });
});

router.post("/", async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        const reply = await getBotAnswer(message);
        return res.json({ success: true, reply });
    } catch (error) {
        console.error("Error in chat route:", error);
        return next(error);
    }
});

module.exports = router;
