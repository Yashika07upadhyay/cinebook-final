require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const seatRoutes = require("./routes/seats");

const app = express();
const server = http.createServer(app);

// ─── Socket.io ──────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// Stricter limit on auth routes — 20 per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: "Too many login attempts. Please wait before trying again." },
});
app.use("/api/auth", authLimiter);

// ─── Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/seats", seatRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    msg: err.message || "Internal server error",
  });
});

// ─── Database + Start ────────────────────────────────────────
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io active`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Auto-release expired seat locks every 5 minutes
setInterval(async () => {
  const Seat = require("./models/Seat");
  const lockExpiryCutoff = new Date(Date.now() - parseInt(process.env.SEAT_LOCK_TIMEOUT_MS || 300000));
  try {
    const result = await Seat.updateMany(
      {
        isLocked: true,
        isBooked: false,
        lockedAt: { $lt: lockExpiryCutoff },
      },
      {
        $set: { isLocked: false, lockedBy: null, lockedAt: null },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`🔓 Released ${result.modifiedCount} expired seat lock(s)`);
      io.emit("seats_refreshed");
    }
  } catch (err) {
    console.error("Lock cleanup error:", err.message);
  }
}, 5 * 60 * 1000);
