//the main app
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const {handle404, masterErrorHandler, FN_verifyTkn, API_Limiter} = require("../handlers/middlewareHandler");
//ROUTES
const authRoutes = require("../routes/auth");
const chatRoutes = require("../routes/chat");
const feedbackRoutes = require("../routes/feedback");
const publishRideRoutes = require("../routes/publishRide");
const bookRideRoutes = require("../routes/bookRide");
const pickupRideRoutes = require("../routes/pickupRide");
const { getRouting } = require("../handlers/GPS_CalcHandler");
const { startLiveTracking } = require("../routes/GPS_fetch");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});
app.set("socketio", io);

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
app.use("/publish-ride", FN_verifyTkn, API_Limiter("standard"), publishRideRoutes);
app.use("/book-ride", FN_verifyTkn, API_Limiter("standard"), bookRideRoutes);
app.use("/pickup-ride", FN_verifyTkn, API_Limiter("standard"), pickupRideRoutes);

// Socket.io connection logic for GPS Tracking
io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    socket.on("simulate_trip", async (data) => {
        const { startCoords, endCoords, tripPhase } = data;
        
        console.log(`[GPS] Fetching route from OSRM...`);
        const routeCoords = await getRouting(startCoords, endCoords);
        
        if (routeCoords) {
            console.log(`[GPS] Route fetched (${routeCoords.length} points). Starting simulation...`);
            startLiveTracking(socket, routeCoords, tripPhase || "active");
        } else {
            socket.emit("error", { message: "Failed to fetch route from OSRM" });
        }
    });

    socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

// error handlers
app.use(handle404);
app.use(masterErrorHandler);

server.listen(PORT, () => {
    console.log(`[Backend] is running on http://localhost:${PORT}`);
});
