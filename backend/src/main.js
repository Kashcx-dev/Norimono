//the main app
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const {handle404, masterErrorHandler, FN_verifyTkn, API_Limiter} = require("../handlers/middlewareHandler");
//ROUTES
const authRoutes = require("../routes/auth");
const chatRoutes = require("../routes/chat");
const feedbackRoutes = require("../routes/feedback");

const app = express();
app.set('trust proxy', 1); // Trust first proxy (solves the X-Forwarded-For rate limit error)
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../react-frontend")));

// Global limiter (optional)
// app.use(API_Limiter("standard")); 
app.use("/auth", API_Limiter("strict"), authRoutes);
app.use("/chat", FN_verifyTkn, API_Limiter("relaxed"), chatRoutes);
app.use("/feedback", FN_verifyTkn, API_Limiter("standard"), feedbackRoutes);

// error handlers
app.use(handle404);
app.use(masterErrorHandler);

app.listen(PORT, () => {
    console.log(`[Backend] is running on http://localhost:${PORT}`);
});
