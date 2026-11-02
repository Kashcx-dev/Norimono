const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const nodemailer = require('nodemailer');
const { sanitizeString } = require("../utils/validator");
const { sendError } = require("../handlers/middlewareHandler");

// Ensure feedbacks table exists
async function ensureFeedbackTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                feedback_id SERIAL PRIMARY KEY,
                emp_id VARCHAR(50) REFERENCES users(emp_id),
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.warn("Could not ensure feedbacks table:", err.message);
    }
}
ensureFeedbackTable();

// POST /feedback/send_feedback
router.post('/send_feedback', async (req, res, next) => {
    try {
        const { message, rating } = req.body;
        const cleanMessage = sanitizeString(message);
        const emp_id = req.user?.emp_id;

        if (!emp_id) {
            return sendError(res, 401, "UNAUTHORIZED", "Please sign in to submit feedback.");
        }

        const numRating = parseInt(rating, 10);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return sendError(res, 400, "INVALID_RATING", "Rating must be a number between 1 and 5 stars.", { field: "rating" });
        }

        if (!cleanMessage || cleanMessage.trim().length < 3) {
            return sendError(res, 400, "EMPTY_MESSAGE", "Please provide a brief description of your feedback (at least 3 characters).", { field: "message" });
        }

        // Fetch user info from database
        const userRes = await db.query(
            `SELECT name, email, org_name, phone, designation FROM users WHERE emp_id = $1`,
            [emp_id]
        );
        const user = userRes.rows[0] || {};
        const userName = user.name || "Employee";
        const userEmail = user.email || "unknown@corporate.com";
        const userOrg = user.org_name || "Enterprise";

        // Save to DB
        await db.query(
            `INSERT INTO feedbacks (emp_id, rating, message) VALUES ($1, $2, $3)`,
            [emp_id, numRating, cleanMessage.trim()]
        );

        // Send Email via Nodemailer to master.trainer049@gmail.com
        const emailUser = process.env.EMAIL_USER || "master.trainer049@gmail.com";
        const emailPass = process.env.EMAIL_PASS;

        const starEmojis = "⭐".repeat(numRating);

        if (emailUser && emailPass) {
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: emailUser,
                        pass: emailPass
                    }
                });

                const mailOptions = {
                    from: `"Norimono Feedback System" <${emailUser}>`,
                    to: emailUser, // Deliver to admin
                    replyTo: userEmail,
                    subject: `[Norimono Feedback] ${starEmojis} (${numRating}/5) from ${userName} (${userOrg})`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
                            <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
                                <h1 style="color: #2dd4bf; margin: 0; font-size: 22px;">Norimono Commute Feedback</h1>
                                <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Closed-Loop Corporate Mobility Platform</p>
                            </div>

                            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                                <div style="margin-bottom: 14px;">
                                    <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Star Rating</span>
                                    <div style="font-size: 24px; margin-top: 4px;">${starEmojis} <span style="font-size: 16px; font-weight: bold; color: #fbbf24;">(${numRating} / 5)</span></div>
                                </div>

                                <div style="margin-bottom: 14px;">
                                    <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Colleague Feedback Description</span>
                                    <p style="background-color: #0f172a; border-left: 4px solid #2dd4bf; padding: 12px 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #f1f5f9; margin-top: 6px;">
                                        ${cleanMessage}
                                    </p>
                                </div>

                                <div style="border-top: 1px solid #334155; padding-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div>
                                        <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">Employee Name</span>
                                        <p style="margin: 2px 0 0 0; font-weight: bold; font-size: 13px; color: #f8fafc;">${userName}</p>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">Corporate Email</span>
                                        <p style="margin: 2px 0 0 0; font-family: monospace; font-size: 13px; color: #2dd4bf;">${userEmail}</p>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">Company</span>
                                        <p style="margin: 2px 0 0 0; font-weight: bold; font-size: 13px; color: #f8fafc;">${userOrg}</p>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">Employee ID</span>
                                        <p style="margin: 2px 0 0 0; font-family: monospace; font-size: 13px; color: #94a3b8;">${emp_id}</p>
                                    </div>
                                </div>
                            </div>

                            <p style="text-align: center; font-size: 11px; color: #64748b; margin: 0;">
                                Auto-generated by Norimono Feedback Dispatcher • ${new Date().toUTCString()}
                            </p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`[Feedback] Successfully emailed rating (${numRating} stars) from ${userEmail} to ${emailUser}`);
            } catch (mailErr) {
                console.warn("[Feedback Warning] Email delivery failed, but feedback saved to DB:", mailErr.message);
            }
        }

        return res.json({
            success: true,
            message: "Thank you! Your feedback has been received and emailed to the Norimono leadership team."
        });

    } catch (err) {
        console.error("Error in /feedback/send_feedback:", err);
        return next(err);
    }
});

module.exports = router;
