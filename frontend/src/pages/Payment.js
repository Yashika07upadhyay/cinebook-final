import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookSeats } from "../services/api";
import Navbar from "../components/Navbar";
import { ToastContainer, toast } from "../components/Toast";
import "../styles/Payment.css";

const TICKET_PRICE = 250;
const CONVENIENCE_FEE = 30;

// Card number formatter
const fmtCard = (val) =>
  val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const fmtExpiry = (val) => {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const validateCard = (f) => {
  const errs = {};
  const cardNum = f.cardNumber.replace(/\s/g, "");
  if (!cardNum) errs.cardNumber = "Card number is required";
  else if (cardNum.length !== 16) errs.cardNumber = "Enter a valid 16-digit card number";

  if (!f.cardHolder.trim()) errs.cardHolder = "Cardholder name is required";
  else if (f.cardHolder.trim().length < 3) errs.cardHolder = "Enter full name as on card";

  if (!f.expiry) errs.expiry = "Expiry date is required";
  else {
    const [mm, yy] = f.expiry.split("/");
    const month = parseInt(mm, 10);
    const year = parseInt("20" + yy, 10);
    const now = new Date();
    if (!mm || !yy || month < 1 || month > 12)
      errs.expiry = "Invalid expiry date";
    else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
      errs.expiry = "Card has expired";
  }

  if (!f.cvv) errs.cvv = "CVV is required";
  else if (!/^\d{3,4}$/.test(f.cvv)) errs.cvv = "Enter 3 or 4 digit CVV";

  return errs;
};

const validateUPI = (f) => {
  const errs = {};
  if (!f.upiId.trim()) errs.upiId = "UPI ID is required";
  else if (!/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(f.upiId.trim()))
    errs.upiId = "Enter a valid UPI ID (e.g. name@upi)";
  return errs;
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { seats = [], total = 0 } = location.state || {};

  const [tab, setTab] = useState("card");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [card, setCard] = useState({ cardNumber: "", cardHolder: "", expiry: "", cvv: "" });
  const [upi, setUpi] = useState({ upiId: "" });
  const [showCvv, setShowCvv] = useState(false);

  // Redirect if no seats
  if (!seats.length) {
    navigate("/home");
    return null;
  }

  const grandTotal = total + CONVENIENCE_FEE;

  const setCardField = (key) => (e) => {
    let val = e.target.value;
    if (key === "cardNumber") val = fmtCard(val);
    if (key === "expiry") val = fmtExpiry(val);
    if (key === "cvv") val = val.replace(/\D/g, "").slice(0, 4);
    setCard(f => ({ ...f, [key]: val }));
    setErrors(err => ({ ...err, [key]: "" }));
  };

  const setUpiField = (key) => (e) => {
    setUpi(f => ({ ...f, [key]: e.target.value }));
    setErrors(err => ({ ...err, [key]: "" }));
  };

  const handlePay = async () => {
    let errs = {};
    if (tab === "card") errs = validateCard(card);
    else errs = validateUPI(upi);

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const paymentDetails = tab === "card"
        ? { method: "card", last4: card.cardNumber.replace(/\s/g, "").slice(-4) }
        : { method: "upi", upiId: upi.upiId };

      await bookSeats(seats.map(s => s._id), paymentDetails);
      navigate("/confirmed", { state: { seats, total: grandTotal, paymentDetails } });
    } catch (err) {
      toast.error(err.response?.data?.msg || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const maskedCard = card.cardNumber
    ? card.cardNumber.replace(/\d(?=.{5})/g, "•")
    : "•••• •••• •••• ••••";

  return (
    <div className="payment-page">
      <ToastContainer />
      <Navbar />

      <div className="payment-layout fade-up">
        {/* LEFT: Payment Form */}
        <div>
          <div className="pay-card">
            <h2 className="pay-card-title">PAYMENT DETAILS</h2>

            <div className="pay-tabs">
              {[
                { key: "card", label: "💳 Card" },
                { key: "upi",  label: "📱 UPI" },
                { key: "wallet", label: "👛 Wallet" },
              ].map(t => (
                <button
                  key={t.key}
                  className={`pay-tab ${tab === t.key ? "active" : ""}`}
                  onClick={() => { setTab(t.key); setErrors({}); }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "card" && (
              <>
                <div className="card-preview">
                  <div className="card-chip">💳</div>
                  <div className="card-number">{maskedCard}</div>
                  <div className="card-bottom">
                    <div>
                      <div>Cardholder</div>
                      <div className="card-holder-display">{card.cardHolder || "YOUR NAME"}</div>
                    </div>
                    <div>
                      <div>Expires</div>
                      <div className="card-holder-display">{card.expiry || "MM/YY"}</div>
                    </div>
                  </div>
                </div>

                <div className="pay-field">
                  <label>Card Number</label>
                  <input
                    placeholder="1234 5678 9012 3456"
                    value={card.cardNumber}
                    onChange={setCardField("cardNumber")}
                    className={errors.cardNumber ? "has-error" : ""}
                    inputMode="numeric"
                  />
                  {errors.cardNumber && <div className="pay-field-error">{errors.cardNumber}</div>}
                </div>

                <div className="pay-field">
                  <label>Cardholder Name</label>
                  <input
                    placeholder="Name as on card"
                    value={card.cardHolder}
                    onChange={setCardField("cardHolder")}
                    className={errors.cardHolder ? "has-error" : ""}
                    autoComplete="cc-name"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  />
                  {errors.cardHolder && <div className="pay-field-error">{errors.cardHolder}</div>}
                </div>

                <div className="pay-row">
                  <div className="pay-field">
                    <label>Expiry Date</label>
                    <input
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={setCardField("expiry")}
                      className={errors.expiry ? "has-error" : ""}
                      inputMode="numeric"
                    />
                    {errors.expiry && <div className="pay-field-error">{errors.expiry}</div>}
                  </div>
                  <div className="pay-field">
                    <label>CVV</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showCvv ? "text" : "password"}
                        placeholder="•••"
                        value={card.cvv}
                        onChange={setCardField("cvv")}
                        className={errors.cvv ? "has-error" : ""}
                        inputMode="numeric"
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv(v => !v)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-2)", cursor: "pointer" }}
                      >
                        {showCvv ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {errors.cvv && <div className="pay-field-error">{errors.cvv}</div>}
                  </div>
                </div>
              </>
            )}

            {tab === "upi" && (
              <div className="pay-field upi-field">
                <label>UPI ID</label>
                <input
                  placeholder="yourname@upi"
                  value={upi.upiId}
                  onChange={setUpiField("upiId")}
                  className={errors.upiId ? "has-error" : ""}
                  autoComplete="off"
                />
                {errors.upiId && <div className="pay-field-error">{errors.upiId}</div>}
              </div>
            )}

            {tab === "wallet" && (
              <div style={{ padding: "20px 0", color: "var(--text-2)", textAlign: "center", fontSize: 14 }}>
                🚧 Wallet payments coming soon.<br />
                <span style={{ color: "var(--text-3)", fontSize: 12 }}>Please use Card or UPI.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="order-summary">
          <div className="pay-card">
            <h2 className="pay-card-title">ORDER SUMMARY</h2>

            <div className="summary-movie">
              <div className="summary-poster">🎭</div>
              <div>
                <div className="summary-title">INTERSTELLAR</div>
                <div className="summary-detail">Screen 3 · IMAX · Today 7:30 PM</div>
              </div>
            </div>

            <div className="summary-seats">
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Seats ({seats.length})
              </div>
              <div className="summary-seat-badges">
                {seats.map(s => (
                  <span key={s._id} className="seat-badge">{s.seatNumber}</span>
                ))}
              </div>
            </div>

            <div className="summary-line">
              <span>{seats.length} × ₹{TICKET_PRICE}</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-line">
              <span>Convenience fee</span>
              <span>₹{CONVENIENCE_FEE}</span>
            </div>
            <div className="summary-line total">
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>

            <button
              className="pay-btn"
              onClick={handlePay}
              disabled={loading || tab === "wallet"}
            >
              {loading
                ? <><span className="spinner" /> Processing…</>
                : `Pay ₹${grandTotal.toLocaleString("en-IN")}`}
            </button>

            <div className="secure-note">🔒 256-bit SSL secured payment</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
