const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio_dark_db";
const SESSION_SECRET = process.env.SESSION_SECRET || "devfolio_dark_secret_session_key_2026";

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB database successfully"))
  .catch((err) => console.error("Database connection error:", err.message));

// Session setup with MongoStore (autoRemove disabled for FerretDB compatibility)
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      autoRemove: "disabled"
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

// Root route: only leads to index.html if session exists
app.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  return res.redirect("/auth.html");
});

// Guard direct access to index.html
app.get("/index.html", (req, res) => {
  if (req.session && req.session.userId) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  return res.redirect("/auth.html");
});

// Route guard for manager dashboard
app.get("/manager.html", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect("/auth.html");
  }
  return res.sendFile(path.join(__dirname, "public", "manager.html"));
});

// Serve static frontend files (disable automatic index.html serving)
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/portfolio", require("./routes/portfolio"));

// Fallback route
app.use((req, res) => {
  if (req.session && req.session.userId) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  return res.redirect("/auth.html");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Student Portfolio server running on http://localhost:${PORT}`);
});
