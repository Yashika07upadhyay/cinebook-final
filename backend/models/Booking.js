const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
      },
    ],
    seatNumbers: [String],
    movie: {
      type: String,
      default: "Interstellar",
    },
    showtime: {
      type: String,
      default: "7:30 PM",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet"],
      required: true,
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    bookingRef: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Generate booking reference before save
bookingSchema.pre("save", function (next) {
  if (!this.bookingRef) {
    this.bookingRef = "CB" + Date.now().toString().slice(-8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
