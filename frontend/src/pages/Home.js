import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSeats, lockSeat, unlockSeat } from "../services/api";
import socket from "../services/socket";
import Seat from "../components/Seat";
import Navbar from "../components/Navbar";
import { ToastContainer, toast } from "../components/Toast";
import "../styles/Home.css";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;
const TICKET_PRICE = 250;

// Group seats by row
const groupByRow = (seats) => {
  const map = {};
  seats.forEach(seat => {
    const row = seat.seatNumber[0];
    if (!map[row]) map[row] = [];
    map[row].push(seat);
  });
  return map;
};

const Home = () => {
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]); // array of seat objects
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  const loadSeats = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetchSeats();
      setSeats(res.data);
    } catch {
      setFetchError("Failed to load seats. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeats();

    socket.on("seat_locked", ({ seatId }) => {
      setSeats(prev => prev.map(s => s._id === seatId ? { ...s, isLocked: true } : s));
    });
    socket.on("seat_unlocked", ({ seatId }) => {
      setSeats(prev => prev.map(s => s._id === seatId ? { ...s, isLocked: false } : s));
    });
    socket.on("seat_booked", ({ seatId }) => {
      setSeats(prev => prev.map(s => s._id === seatId ? { ...s, isBooked: true, isLocked: false } : s));
      // Remove from selected if it got booked by someone else
      setSelected(prev => prev.filter(s => s._id !== seatId));
    });

    return () => {
      socket.off("seat_locked");
      socket.off("seat_unlocked");
      socket.off("seat_booked");
    };
  }, [loadSeats]);

  // Cleanup: unlock seats on unmount
  useEffect(() => {
    return () => {
      selected.forEach(seat => {
        unlockSeat(seat._id).catch(() => {});
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeatClick = async (seat) => {
    const isCurrentlySelected = selected.find(s => s._id === seat._id);

    if (isCurrentlySelected) {
      // Deselect — unlock
      setSelected(prev => prev.filter(s => s._id !== seat._id));
      try { await unlockSeat(seat._id); } catch {}
      return;
    }

    if (selected.length >= 10) {
      toast.error("You can select up to 10 seats at once");
      return;
    }

    // Select — lock
    setSelected(prev => [...prev, seat]);
    try {
      await lockSeat(seat._id);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Could not lock seat, it may have been taken");
      setSelected(prev => prev.filter(s => s._id !== seat._id));
    }
  };

  const handleProceed = () => {
    if (!selected.length) { toast.error("Please select at least one seat"); return; }
    navigate("/payment", { state: { seats: selected, total: selected.length * TICKET_PRICE } });
  };

  const rowMap = groupByRow(seats);

  if (loading) return (
    <div className="loading-screen">
      <span className="spinner" />
      <span>Loading seats…</span>
    </div>
  );

  if (fetchError) return (
    <div className="home-page">
      <Navbar />
      <div className="error-screen">
        <span>⚠️ {fetchError}</span>
        <button className="retry-btn" onClick={loadSeats}>Retry</button>
      </div>
    </div>
  );

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="home-page">
      <ToastContainer />
      <Navbar />

      <div className="movie-banner fade-up">
        <div className="movie-card">
          <div className="movie-poster">🎭</div>
          <div className="movie-info">
            <h2>INTERSTELLAR</h2>
            <div style={{ color: "var(--text-2)", fontSize: 13 }}>Christopher Nolan · Sci-Fi · PG-13</div>
            <div className="movie-meta">
              <span className="meta-tag rating">⭐ 8.7 / 10</span>
              <span className="meta-tag">2h 49m</span>
              <span className="meta-tag">IMAX</span>
              <span className="meta-tag">Screen 3</span>
            </div>
          </div>
          <div className="movie-showtime">
            <div className="showtime-label">Showtime</div>
            <div className="showtime-value">7:30 PM</div>
            <div className="showtime-date">{today}</div>
          </div>
        </div>
      </div>

      <div className="booking-section fade-up-delay">
        <div className="screen-wrap">
          <div className="screen-label">All eyes this way</div>
          <div className="screen" />
        </div>

        <div className="seat-section-label">SELECT YOUR SEATS</div>

        <div className="seat-rows">
          {ROWS.map(row => {
            const rowSeats = rowMap[row] || Array.from({ length: COLS }, (_, i) => ({
              _id: `${row}${i + 1}`,
              seatNumber: `${row}${i + 1}`,
              isBooked: false,
              isLocked: false,
            }));
            return (
              <div className="seat-row" key={row}>
                <div className="row-label">{row}</div>
                {rowSeats.slice(0, 5).map(seat => (
                  <Seat
                    key={seat._id}
                    seat={seat}
                    isSelected={!!selected.find(s => s._id === seat._id)}
                    onSelect={handleSeatClick}
                  />
                ))}
                <div className="row-aisle" />
                {rowSeats.slice(5, 10).map(seat => (
                  <Seat
                    key={seat._id}
                    seat={seat}
                    isSelected={!!selected.find(s => s._id === seat._id)}
                    onSelect={handleSeatClick}
                  />
                ))}
              </div>
            );
          })}
        </div>

        <div className="legend">
          {[
            { cls: "available", label: "Available" },
            { cls: "selected", label: "Your Selection" },
            { cls: "locked-other", label: "Reserved" },
            { cls: "booked", label: "Booked" },
          ].map(({ cls, label }) => (
            <div className="legend-item" key={cls}>
              <div className={`legend-dot ${cls}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="booking-bar">
        <div className="booking-bar-info">
          <div className="bar-stat">
            <div className="bar-stat-label">Selected</div>
            <div className="bar-stat-value">{selected.length} seat{selected.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="bar-stat">
            <div className="bar-stat-label">Total</div>
            <div className="bar-stat-value gold">₹{(selected.length * TICKET_PRICE).toLocaleString("en-IN")}</div>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="selected-seats-list">
            {selected.map(s => s.seatNumber).join(", ")}
          </div>
        )}

        <button className="book-btn" onClick={handleProceed} disabled={!selected.length}>
          Proceed to Pay →
        </button>
      </div>
    </div>
  );
};

export default Home;
