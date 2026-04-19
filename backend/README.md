# 🎬 CineBook — Movie Ticket Booking System

A full-stack concurrent seat booking system with JWT auth, real-time seat locking via Socket.io, and dummy payment flow.

---

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env          # Edit JWT_SECRET and MONGO_URI
npm run seed                  # Seeds 80 seats (8 rows × 10 cols)
npm run dev                   # Starts on http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install
npm start                     # Starts on http://localhost:3000
```

---

## 📁 Project Structure

```
frontend/src/
├── context/AuthContext.js      # JWT auth state (login/logout/user)
├── pages/
│   ├── Login.js               # Login with validation
│   ├── Register.js            # Register with password strength
│   ├── Home.js                # Seat selection with real-time updates
│   ├── Payment.js             # Card / UPI payment flow
│   └── BookingConfirmed.js    # Booking receipt with ticket UI
├── components/
│   ├── Seat.js                # Individual seat button
│   ├── Navbar.js              # Top nav with user avatar
│   └── Toast.js               # Global toast notifications
├── services/
│   ├── api.js                 # Axios API layer (auto-attaches JWT)
│   └── socket.js              # Socket.io client
└── styles/
    ├── global.css             # Design tokens, fonts, animations
    ├── Auth.css               # Shared auth page styles
    ├── Home.css               # Seat booking page
    ├── Payment.css            # Payment page
    └── Confirmed.css          # Booking confirmed + ticket

backend/
├── server.js                  # Express + Socket.io + MongoDB
├── models/
│   ├── User.js                # User model (bcrypt password hashing)
│   ├── Seat.js                # Seat model (lock state, timeout)
│   └── Booking.js             # Booking + payment record
├── routes/
│   ├── auth.js                # POST /register, POST /login, GET /me
│   └── seats.js               # GET /, POST /lock, /unlock, /book
├── middleware/auth.js          # JWT verification middleware
└── config/seed.js             # Database seeder
```

---

## 🔑 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user → returns JWT |
| POST | `/api/auth/login`    | Login → returns JWT |
| GET  | `/api/auth/me`       | Get current user (auth required) |

### Seats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/seats`            | All seats with lock status |
| POST | `/api/seats/lock`       | Atomically lock a seat |
| POST | `/api/seats/unlock`     | Release your lock |
| POST | `/api/seats/book`       | Book seats + create payment record |
| GET  | `/api/seats/my-bookings`| Current user's booking history |

---

## ⚡ Features

- **Concurrent Seat Locking** — Atomic `findOneAndUpdate` prevents double booking
- **Auto Lock Expiry** — Locks release after 5 minutes (configurable via `SEAT_LOCK_TIMEOUT_MS`)
- **Real-time Updates** — Socket.io broadcasts `seat_locked`, `seat_unlocked`, `seat_booked`
- **JWT Authentication** — Secure stateless auth; token auto-attached via Axios interceptor
- **Registration + Login** — Full validation (password strength, email format, confirm password)
- **Payment Flow** — Card (with live preview + CVV) and UPI with full validation
- **Booking Record** — Every booking saved to DB with payment details and unique reference
- **Rate Limiting** — 100 req/15min general; 20 req/15min on auth routes
- **Cinematic UI** — Dark theme, Bebas Neue headings, gold accents, grain overlay

---

## 🎨 UI Highlights

- **Login / Register**: Split-panel layout, password strength meter, show/hide toggle
- **Seat Map**: 8 rows × 10 seats with aisle gap, row labels, real-time color states
- **Payment**: Live card preview that updates as you type, UPI validation, order summary
- **Booking Confirmed**: Animated ticket with barcode, printable receipt

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, React Router v6, Axios, Socket.io-client |
| Backend | Node.js, Express, Mongoose, Socket.io |
| Database | MongoDB |
| Auth | JWT + bcryptjs |
| Styling | CSS Variables, Google Fonts (Bebas Neue + DM Sans) |
