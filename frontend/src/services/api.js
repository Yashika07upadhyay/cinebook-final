import axios from "axios";

const BASE_URL = "https://cinebookfinal.onrender.com/";

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const loginUser = (email, password) =>
  api.post("/api/auth/login", { email, password });

export const registerUser = (name, email, password) =>
  api.post("/api/auth/register", { name, email, password });

// Seats
export const fetchSeats = () => api.get("/api/seats");

export const lockSeat = (seatId) =>
  api.post("/api/seats/lock", { seatId });

export const unlockSeat = (seatId) =>
  api.post("/api/seats/unlock", { seatId });

export const bookSeats = (seatIds, paymentDetails) =>
  api.post("/api/seats/book", { seatIds, paymentDetails });

export default api;
