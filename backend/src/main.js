//the main app
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const {handle404, masterErrorHandler, FN_verifyTkn, API_Limiter} = require("../handlers/middlewareHandler");
const { sanitizeInput } = require("../utils/sanitize");
//ROUTES
const authRoutes = require("../routes/auth");
const chatRoutes = require("../routes/chat");
const feedbackRoutes = require("../routes/feedback");
const publishRideRoutes = require("../routes/publishRide");
const bookRideRoutes = require("../routes/bookRide");
const pickupRideRoutes = require("../routes/pickupRide");
const adminRoutes = require("../routes/admin");
const registerVehicleRoutes = require("../routes/registerVehicle");
const dropPassengerRoutes = require("../routes/dropPassenger");
const walletRoutes = require("../routes/wallet");
const finishRideRoutes = require("../routes/finishRide");
const ridesRoutes = require("../routes/rides");
const historyRoutes = require("../routes/history");
const rateRoutes = require("../routes/rate");
const h3Routes = require("../routes/h3routing");
const customErrorRoutes = require("../routes/customErrors");
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

const fs = require("fs");
const { xssSanitizerMiddleware } = require("../utils/sanitize");
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(xssSanitizerMiddleware);

const distPath = path.join(__dirname, "../../react-frontend/dist");
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
} else {
    app.use(express.static(path.join(__dirname, "../../react-frontend")));
}

// Global limiter (optional)
// app.use(API_Limiter("standard")); 
app.use("/auth", API_Limiter("strict"), authRoutes);
app.use("/chat", FN_verifyTkn, API_Limiter("relaxed"), chatRoutes);
app.use("/feedback", FN_verifyTkn, API_Limiter("standard"), feedbackRoutes);
app.use("/publish-ride", FN_verifyTkn, API_Limiter("standard"), publishRideRoutes);
app.use("/book-ride", FN_verifyTkn, API_Limiter("standard"), bookRideRoutes);
app.use("/pickup-ride", FN_verifyTkn, API_Limiter("standard"), pickupRideRoutes);
app.use("/register-vehicle", FN_verifyTkn, API_Limiter("standard"), registerVehicleRoutes);
app.use("/drop-passenger", FN_verifyTkn, API_Limiter("standard"), dropPassengerRoutes);
app.use("/admin", FN_verifyTkn, API_Limiter("standard"), adminRoutes);
app.use("/wallet", FN_verifyTkn, API_Limiter("standard"), walletRoutes);
app.use("/finish-ride", FN_verifyTkn, API_Limiter("standard"), finishRideRoutes);
app.use("/rides", FN_verifyTkn, API_Limiter("standard"), ridesRoutes);
app.use("/history", FN_verifyTkn, API_Limiter("standard"), historyRoutes);
app.use("/rate", FN_verifyTkn, API_Limiter("standard"), rateRoutes);
app.use("/h3", API_Limiter("standard"), h3Routes);
app.use("/api", customErrorRoutes);

// Socket.io connection logic for GPS Tracking, Chat, Voice Calls & Notifications
io.on("connection", (socket) => {
	console.log(`[Socket.io] Client connected: ${socket.id}`);
	
	// User personal room for private notifications & direct call invites
	socket.on("register_user", (data) => {
		if (data && data.emp_id) {
			socket.join(`user_${data.emp_id}`);
			console.log(`[Socket.io] Client ${socket.id} registered in room user_${data.emp_id}`);
		}
	});

	socket.on("join_ride_room", (data) => {
		if (data && data.ride_id) {
			socket.join(`ride_${data.ride_id}`);
			console.log(`[Socket.io] Client ${socket.id} joined room ride_${data.ride_id}`);
		}
	});

	socket.on("start_tracking", async (data) => {
		// data: { ride_id, startCoords: [lat, lon], endCoords: [lat, lon], phase: 'pickup' | 'dropoff' }
		if (data && data.ride_id && data.startCoords && data.endCoords) {
			console.log(`[Socket.io] Starting tracking for ride ${data.ride_id}, phase ${data.phase}`);
			await startLiveTracking(io, data.ride_id, data.startCoords, data.endCoords, data.phase);
		}
	});

    // Chat functionality
    socket.on('send_chat_message', (data) => {
        const { ride_id, ...messageData } = data;
        if (messageData.text) {
            messageData.text = sanitizeInput(messageData.text);
        }
        const roomName = `ride_${ride_id}`;
        
        // Broadcast the message to everyone in the ride room (driver & passenger)
        io.to(roomName).emit('new_chat_message', messageData);
    });

    // WebRTC Voice Call Signaling & Invites
    socket.on('call_user', (data) => {
        // data: { target_emp_id, caller_emp_id, caller_name, ride_id }
        const { target_emp_id, ...callData } = data;
        if (target_emp_id) {
            io.to(`user_${target_emp_id}`).emit('incoming_call', callData);
        }
        if (callData.ride_id) {
            socket.to(`ride_${callData.ride_id}`).emit('incoming_call', callData);
        }
    });

    socket.on('call_response', (data) => {
        // data: { caller_emp_id, accepted: boolean, ride_id }
        if (data.caller_emp_id) {
            io.to(`user_${data.caller_emp_id}`).emit('call_response', data);
        }
        if (data.ride_id) {
            socket.to(`ride_${data.ride_id}`).emit('call_response', data);
        }
    });

    socket.on('voice_signal', (data) => {
        const { ride_id, ...signalData } = data;
        const roomName = `ride_${ride_id}`;
        socket.to(roomName).emit('voice_signal', signalData);
    });

	socket.on("disconnect", () => {
		console.log(`[Socket.io] Client disconnected: ${socket.id}`);
	});
});

// SPA fallback for frontend client routing
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith("/auth") || req.path.startsWith("/rides") || req.path.startsWith("/book-ride") || req.path.startsWith("/publish-ride") || req.path.startsWith("/pickup-ride") || req.path.startsWith("/finish-ride") || req.path.startsWith("/drop-passenger") || req.path.startsWith("/admin") || req.path.startsWith("/wallet") || req.path.startsWith("/feedback") || req.path.startsWith("/chat") || req.path.startsWith("/history") || req.path.startsWith("/rate") || req.path.startsWith("/h3") || req.path.startsWith("/api") || req.path.startsWith("/register-vehicle")) {
        return next();
    }
    const indexPath = path.join(__dirname, "../../react-frontend/dist/index.html");
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    next();
});

// error handlers
app.use(handle404);
app.use(masterErrorHandler);

server.listen(PORT, async () => {
    console.log(`[Backend] is running on http://localhost:${PORT}`);
    try {
        const db = require("../handlers/dbHandler");
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='preferences') THEN 
                    ALTER TABLE rides ADD COLUMN preferences JSONB DEFAULT '{"chattiness":"blabla","ac":true,"smoking":false,"music":true,"luggage":"medium","max_two_back":true}'::jsonb;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='stopovers') THEN 
                    ALTER TABLE rides ADD COLUMN stopovers JSONB DEFAULT '[]'::jsonb;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='is_recurring') THEN 
                    ALTER TABLE rides ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='instant_booking') THEN 
                    ALTER TABLE rides ADD COLUMN instant_booking BOOLEAN DEFAULT TRUE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='luggage_size') THEN 
                    ALTER TABLE bookings ADD COLUMN luggage_size VARCHAR(20) DEFAULT 'medium';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='passenger_notes') THEN 
                    ALTER TABLE bookings ADD COLUMN passenger_notes TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='selected_stopover') THEN 
                    ALTER TABLE bookings ADD COLUMN selected_stopover VARCHAR(100);
                END IF;
            END $$;
        `);
        await db.query(`
            UPDATE rides 
            SET departure_time = NOW() + (INTERVAL '45 minutes' * (ride_id % 4 + 1))
            WHERE status IN ('scheduled', 'in_progress') AND departure_time < NOW();
        `);
        console.log("[DB] Schema verified with BlaBlaCar preference columns & active ride schedules refreshed.");
    } catch (e) {
        console.warn("[DB] Startup schema verify:", e.message);
    }
});

module.exports = { app, server, io };
