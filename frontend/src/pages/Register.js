import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/api";
import "../styles/Auth.css";

const validate = (form) => {
  const errors = {};

  if (!form.name.trim()) errors.name = "Full name is required";
  else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address";

  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 6)
    errors.password = "Password must be at least 6 characters";
  else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password))
    errors.password = "Password must contain letters and numbers";

  if (!form.confirm) errors.confirm = "Please confirm your password";
  else if (form.password !== form.confirm)
    errors.confirm = "Passwords do not match";

  return errors;
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const colors = ["", "#e84040", "#f59e0b", "#3b82f6", "#22c55e", "#10b981"];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            height: 3, flex: 1, borderRadius: 2,
            background: i <= strength ? colors[strength] : "rgba(255,255,255,0.08)",
            transition: "background 0.3s"
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[strength] }}>{labels[strength]}</div>
    </div>
  );
};

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: "" }));
    setGlobalError("");
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError("");
    try {
      const res = await registerUser(form.name.trim(), form.email.trim(), form.password);
      login(res.data.token, res.data.user);
      navigate("/home");
    } catch (err) {
      setGlobalError(err.response?.data?.msg || "Registration failed. Please try again.");
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

        <h1 className="auth-heading">CREATE ACCOUNT</h1>
        <p className="auth-sub">Join to start booking premium seats</p>

        {globalError && <div className="global-error">{globalError}</div>}

        <div className="field">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={form.name}
            onChange={set("name")}
            onKeyDown={handleKey}
            className={errors.name ? "has-error" : ""}
            autoComplete="name"
          />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>

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
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set("password")}
              onKeyDown={handleKey}
              className={errors.password ? "has-error" : ""}
              autoComplete="new-password"
            />
            <button className="password-toggle" onClick={() => setShowPwd(v => !v)} type="button" tabIndex={-1}>
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>
          <PasswordStrength password={form.password} />
          {errors.password && <div className="field-error">{errors.password}</div>}
          <div className="field-hint">Use letters and numbers for a stronger password</div>
        </div>

        <div className="field">
          <label>Confirm Password</label>
          <div className="password-wrap">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={set("confirm")}
              onKeyDown={handleKey}
              className={errors.confirm ? "has-error" : ""}
              autoComplete="new-password"
            />
            <button className="password-toggle" onClick={() => setShowConfirm(v => !v)} type="button" tabIndex={-1}>
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.confirm && <div className="field-error">{errors.confirm}</div>}
        </div>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : "CREATE ACCOUNT"}
        </button>

        <div className="auth-divider">or</div>

        <div className="auth-switch">
          Already have an account?{" "}
          <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
