
const jwt = require("jsonwebtoken");

function authenticateStaff(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check whether the request contains a token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in."
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make sure the user is authorised staff
    if (decoded.role !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Staff only."
      });
    }

    // Save staff information for the next route
    req.staff = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token."
    });
  }
}

module.exports = authenticateStaff;
