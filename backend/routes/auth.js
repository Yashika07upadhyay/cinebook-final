const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email address"),
    body("password")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
      .matches(/(?=.*[a-zA-Z])(?=.*\d)/).withMessage("Password must contain letters and numbers"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ msg: "An account with this email already exists." });
      }

      const user = await User.create({ name, email, password });
      const token = signToken(user._id);

      res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ msg: "Server error. Please try again." });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ msg: "Invalid email or password." });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ msg: "Invalid email or password." });
      }

      const token = signToken(user._id);
      res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ msg: "Server error. Please try again." });
    }
  }
);

// GET /api/auth/me — get current user
router.get("/me", auth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;
