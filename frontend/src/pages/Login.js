import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";
import "../styles/Auth.css";

const validate = (email, password) => {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address";

  if (!password) errors.password = "Password is required";
  else if (password.length < 6)
    errors.password = "Password must be at least 6 characters";

  return errors;
};

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: "" }));
    setGlobalError("");
  };

  const handleSubmit = async () => {
    const errs = validate(form.email, form.password);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError("");
    try {
      const res = await loginUser(form.email.trim(), form.password);
      login(res.data.token, res.data.user);
      navigate("/home");
    } catch (err) {
      setGlobalError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎬</div>
          <div className="auth-logo-text">CINE<span>BOOK</span></div>
        </div>

        <h1 className="auth-heading">WELCOME BACK</h1>
        <p className="auth-sub">Sign in to book your seats</p>

        {globalError && <div className="global-error">{globalError}</div>}

        <div className="field">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            onKeyDown={handleKey}
            className={errors.email ? "has-error" : ""}
            autoComplete="email"
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>

        <div className="field">
          <label>Password</label>
          <div className="password-wrap">
            <input
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              onKeyDown={handleKey}
              className={errors.password ? "has-error" : ""}
              autoComplete="current-password"
            />
            <button
              className="password-toggle"
              onClick={() => setShowPwd((v) => !v)}
              type="button"
              tabIndex={-1}
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : "SIGN IN"}
        </button>

        <div className="auth-divider">or</div>

        <div className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
