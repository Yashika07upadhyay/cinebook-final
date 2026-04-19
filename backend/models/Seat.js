const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    row: {
      type: String,
      required: true,
    },
    column: {
      type: Number,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    showtime: {
      type: String,
      default: "7:30 PM",
    },
    price: {
      type: Number,
      default: 250,
    },
  },
  { timestamps: true }
);

// Index for fast lookup
seatSchema.index({ isBooked: 1, isLocked: 1 });
seatSchema.index({ lockedBy: 1 });

// Virtual: is the lock expired?
seatSchema.virtual("isLockExpired").get(function () {
  if (!this.lockedAt) return false;
  const timeout = parseInt(process.env.SEAT_LOCK_TIMEOUT_MS || 300000);
  return Date.now() - new Date(this.lockedAt).getTime() > timeout;
});

module.exports = mongoose.model("Seat", seatSchema);
