import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSeats } from "../services/api";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "../styles/MyBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/seats/my-bookings")
      .then((res) => setBookings(res.data))
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mybookings-page">
      <Navbar />
      <div className="mybookings-content fade-up">
        <div className="mybookings-header">
          <h1>MY BOOKINGS</h1>
          <button className="back-btn" onClick={() => navigate("/home")}>
            ← Back to Seats
          </button>
        </div>

        {loading && (
          <div className="bookings-loading">
            <span className="spinner" /> Loading bookings…
          </div>
        )}

        {error && <div className="bookings-error">{error}</div>}

        {!loading && !error && bookings.length === 0 && (
          <div className="bookings-empty">
            <div className="empty-icon">🎟️</div>
            <div className="empty-title">No bookings yet</div>
            <div className="empty-sub">Book your first movie seats!</div>
            <button className="auth-btn" style={{ marginTop: 20, maxWidth: 200 }} onClick={() => navigate("/home")}>
              Browse Seats
            </button>
          </div>
        )}

        <div className="bookings-grid">
          {bookings.map((b) => (
            <div className="booking-item" key={b._id}>
              <div className="booking-item-header">
                <div>
                  <div className="booking-movie">{b.movie}</div>
                  <div className="booking-ref">#{b.bookingRef}</div>
                </div>
                <div className={`booking-status ${b.paymentStatus}`}>
                  {b.paymentStatus === "success" ? "✓ Confirmed" : b.paymentStatus}
                </div>
              </div>

              <div className="booking-item-body">
                <div className="booking-detail-row">
                  <span className="bd-label">Seats</span>
                  <span className="bd-value mono">{b.seatNumbers?.join(", ")}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="bd-label">Showtime</span>
                  <span className="bd-value">{b.showtime}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="bd-label">Booked On</span>
                  <span className="bd-value">{fmt(b.createdAt)}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="bd-label">Payment</span>
                  <span className="bd-value">
                    {b.paymentMethod === "upi"
                      ? `UPI · ${b.paymentDetails?.upiId || ""}`
                      : `Card ····${b.paymentDetails?.last4 || "****"}`}
                  </span>
                </div>
              </div>

              <div className="booking-item-footer">
                <span className="booking-amount">₹{b.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
