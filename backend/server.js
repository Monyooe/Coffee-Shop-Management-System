
// 1. Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// 2. Connect to the database
const redis = require("./database");

// 3. Import API routes
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");

// 4. Create Express application
const app = express();

// 5. Middleware
app.use(cors());
app.use(express.json());

// 6. Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await redis.ping();

    return res.status(200).json({
      success: true,
      message: "Coffee Shop API is running.",
      database: "Connected"
    });
  } catch (error) {
    console.error("Health check error:", error);

    return res.status(503).json({
      success: false,
      message: "API is running, but database connection failed.",
      database: "Disconnected"
    });
  }
});

// 7. Staff login endpoint
app.post("/api/staff/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your username and password."
      });
    }

    // Check staff credentials
    if (
      username !== process.env.STAFF_USERNAME ||
      password !== process.env.STAFF_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Incorrect username or password."
      });
    }

    // Create JWT authentication token
    const token = jwt.sign(
      {
        username: username,
        role: "staff"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Staff login successful.",
      token
    });

  } catch (error) {
    console.error("Staff login error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not process staff login."
    });
  }
});

// 8. Register menu and order routes
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// 9. Handle unknown routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// 10. Handle unexpected errors
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

// 11. Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Coffee Shop API running on port ${PORT}`);
});
