require("dotenv").config();
const mongoose = require("mongoose");
const Seat = require("../models/Seat");

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Seat.deleteMany({});
    console.log("Cleared existing seats");

    const seats = [];
    for (const row of ROWS) {
      for (let col = 1; col <= COLS; col++) {
        seats.push({
          seatNumber: `${row}${col}`,
          row,
          column: col,
          isBooked: false,
          isLocked: false,
          price: 250,
          showtime: "7:30 PM",
        });
      }
    }

    await Seat.insertMany(seats);
    console.log(`✅ Seeded ${seats.length} seats (${ROWS.length} rows × ${COLS} columns)`);
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
