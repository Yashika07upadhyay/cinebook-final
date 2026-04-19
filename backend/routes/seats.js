const express = require("express");
const router = express.Router();
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

const LOCK_TIMEOUT_MS = parseInt(process.env.SEAT_LOCK_TIMEOUT_MS || 300000);
const CONVENIENCE_FEE = 30;

// Helper: auto-release expired locks
const releaseExpiredLock = async (seat, io) => {
  if (
    seat.isLocked &&
    !seat.isBooked &&
    seat.lockedAt &&
    Date.now() - new Date(seat.lockedAt).getTime() > LOCK_TIMEOUT_MS
  ) {
    seat.isLocked = false;
    seat.lockedBy = null;
    seat.lockedAt = null;
    await seat.save();
    io?.emit("seat_unlocked", { seatId: seat._id });
  }
};

// GET /api/seats — all seats
router.get("/", auth, async (req, res) => {
  try {
    let seats = await Seat.find().sort({ row: 1, column: 1 });

    // Release expired locks
    const io = req.app.get("io");
    for (const seat of seats) {
      await releaseExpiredLock(seat, io);
    }

    // Re-fetch after cleanup
    seats = await Seat.find().sort({ row: 1, column: 1 });
    res.json(seats);
  } catch (err) {
    console.error("Fetch seats error:", err);
    res.status(500).json({ msg: "Failed to load seats." });
  }
});

// POST /api/seats/lock — atomically lock a seat
router.post("/lock", auth, async (req, res) => {
  const { seatId } = req.body;
  if (!seatId) return res.status(400).json({ msg: "seatId is required" });

  const io = req.app.get("io");
  const lockExpiryCutoff = new Date(Date.now() - LOCK_TIMEOUT_MS);

  try {
    // Atomic findOneAndUpdate: only lock if seat is free or lock expired
    const seat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        isBooked: false,
        $or: [
          { isLocked: false },
          { lockedAt: { $lt: lockExpiryCutoff } }, // expired lock
        ],
      },
      {
        $set: {
          isLocked: true,
          lockedBy: req.user._id,
          lockedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!seat) {
      return res.status(409).json({ msg: "Seat is already locked or booked." });
    }

    io?.emit("seat_locked", { seatId: seat._id });
    res.json({ msg: "Seat locked successfully.", seat });
  } catch (err) {
    console.error("Lock seat error:", err);
    res.status(500).json({ msg: "Failed to lock seat." });
  }
});

// POST /api/seats/unlock — release a lock
router.post("/unlock", auth, async (req, res) => {
  const { seatId } = req.body;
  if (!seatId) return res.status(400).json({ msg: "seatId is required" });

  const io = req.app.get("io");

  try {
    const seat = await Seat.findOneAndUpdate(
      {
        _id: seatId,
        lockedBy: req.user._id,
        isBooked: false,
      },
      {
        $set: { isLocked: false, lockedBy: null, lockedAt: null },
      },
      { new: true }
    );

    if (!seat) {
      return res.status(404).json({ msg: "Seat not found or not locked by you." });
    }

    io?.emit("seat_unlocked", { seatId: seat._id });
    res.json({ msg: "Seat unlocked." });
  } catch (err) {
    console.error("Unlock seat error:", err);
    res.status(500).json({ msg: "Failed to unlock seat." });
  }
});

// POST /api/seats/book — book multiple seats + create booking record
router.post("/book", auth, async (req, res) => {
  const { seatIds, paymentDetails } = req.body;

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ msg: "At least one seat must be selected." });
  }
  if (!paymentDetails?.method) {
    return res.status(400).json({ msg: "Payment method is required." });
  }

  const io = req.app.get("io");

  try {
    // Verify all seats are locked by this user and not booked
    const seats = await Seat.find({
      _id: { $in: seatIds },
      isBooked: false,
      isLocked: true,
      lockedBy: req.user._id,
    });

    if (seats.length !== seatIds.length) {
      return res.status(409).json({
        msg: "One or more seats are no longer available. Please re-select.",
      });
    }

    // Mark seats as booked (atomic)
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      {
        $set: {
          isBooked: true,
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          bookedBy: req.user._id,
        },
      }
    );

    const totalAmount = seats.length * seats[0].price + CONVENIENCE_FEE;
    const seatNumbers = seats.map((s) => s.seatNumber);

    // Create booking record
    const booking = await Booking.create({
      user: req.user._id,
      seats: seatIds,
      seatNumbers,
      totalAmount,
      paymentMethod: paymentDetails.method,
      paymentDetails,
      paymentStatus: "success",
    });

    // Broadcast bookings to all connected clients
    seatIds.forEach((seatId) => {
      io?.emit("seat_booked", { seatId });
    });

    res.status(201).json({
      msg: "Booking successful!",
      booking: {
        id: booking._id,
        bookingRef: booking.bookingRef,
        seatNumbers,
        totalAmount,
        paymentMethod: paymentDetails.method,
      },
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ msg: "Booking failed. Please try again." });
  }
});

// GET /api/seats/my-bookings — user's booking history
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch bookings." });
  }
});

module.exports = router;
