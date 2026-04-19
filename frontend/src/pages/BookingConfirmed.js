import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/Confirmed.css";

const BookingConfirmed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seats = [], total = 0, paymentDetails = {} } = location.state || {};
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    if (!seats.length) navigate("/home");
  }, [seats.length, navigate]);

  const bookingId = "CB" + Date.now().toString().slice(-8).toUpperCase();
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="confirmed-page">
      <Navbar />
      <div className={`confirmed-content ${show ? "show" : ""}`}>
        <div className="confirmed-icon">🎉</div>
        <h1 className="confirmed-title">BOOKING CONFIRMED!</h1>
        <p className="confirmed-sub">Your seats are reserved. Enjoy the show!</p>

        <div className="ticket-card">
          <div className="ticket-header">
            <div>
              <div className="ticket-movie">INTERSTELLAR</div>
              <div className="ticket-meta">Screen 3 · IMAX · Today 7:30 PM</div>
            </div>
            <div className="ticket-poster">🎭</div>
          </div>

          <div className="ticket-divider">
            <div className="ticket-notch left" />
            <div className="ticket-dots" />
            <div className="ticket-notch right" />
          </div>

          <div className="ticket-body">
            <div className="ticket-detail">
              <div className="ticket-label">Booking ID</div>
              <div className="ticket-value mono">{bookingId}</div>
            </div>
            <div className="ticket-detail">
              <div className="ticket-label">Date</div>
              <div className="ticket-value">{today}</div>
            </div>
            <div className="ticket-detail">
              <div className="ticket-label">Seats</div>
              <div className="ticket-value mono">{seats.map(s => s.seatNumber).join(", ")}</div>
            </div>
            <div className="ticket-detail">
              <div className="ticket-label">Payment</div>
              <div className="ticket-value">
                {paymentDetails.method === "upi"
                  ? `UPI · ${paymentDetails.upiId}`
                  : `Card ending ••••${paymentDetails.last4 || "0000"}`}
              </div>
            </div>
            <div className="ticket-detail">
              <div className="ticket-label">Amount Paid</div>
              <div className="ticket-value gold">₹{total.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="ticket-barcode">
            <div className="barcode-lines">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="barcode-line" style={{
                  height: Math.random() > 0.4 ? "100%" : "60%",
                  width: Math.random() > 0.6 ? 3 : 2,
                }} />
              ))}
            </div>
            <div className="barcode-text">{bookingId}</div>
          </div>
        </div>

        <div className="confirmed-actions">
          <button className="action-btn primary" onClick={() => navigate("/home")}>
            Book More Seats
          </button>
          <button className="action-btn secondary" onClick={() => navigate("/my-bookings")}>
            📋 My Bookings
          </button>
          <button className="action-btn secondary" onClick={() => window.print()}>
            🖨️ Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmed;
