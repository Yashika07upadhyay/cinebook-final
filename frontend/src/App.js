import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Payment from "./pages/Payment";
import BookingConfirmed from "./pages/BookingConfirmed";
import MyBookings from "./pages/MyBookings";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/home" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/confirmed" element={<ProtectedRoute><BookingConfirmed /></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
