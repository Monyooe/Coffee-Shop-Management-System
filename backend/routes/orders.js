
const express = require("express");
const { randomUUID } = require("crypto");
const redis = require("../database");
const authenticateStaff = require("../middleware/auth");

const router = express.Router();

const ORDER_IDS_KEY = "orders:ids";

const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
  "Collected"
];

// Get date in Lesotho timezone
function getLesothoDate(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Maseru",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

// GET /api/orders
// View all orders (staff only)
router.get("/", authenticateStaff, async (req, res) => {
  try {
    const ids = await redis.smembers(ORDER_IDS_KEY);

    const orders = await Promise.all(
      ids.map((id) => redis.get(`order:${id}`))
    );

    const validOrders = orders.filter((order) => order !== null);

    validOrders.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: validOrders.length,
      orders: validOrders
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve orders."
    });
  }
});

// GET /api/orders/summary/daily
// View today's sales and order summary (staff only)
router.get("/summary/daily", authenticateStaff, async (req, res) => {
  try {
    const today = getLesothoDate(new Date());

    const ids = await redis.smembers(ORDER_IDS_KEY);

    const orders = await Promise.all(
      ids.map((id) => redis.get(`order:${id}`))
    );

    const todaysOrders = orders.filter((order) => {
      if (!order || !order.createdAt) {
        return false;
      }

      const orderDate = getLesothoDate(new Date(order.createdAt));

      return orderDate === today;
    });

    const statusCounts = {
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Collected: 0
    };

    let totalSales = 0;

    todaysOrders.forEach((order) => {
      if (Object.prototype.hasOwnProperty.call(statusCounts, order.status)) {
        statusCounts[order.status]++;
      }

      totalSales += Number(order.total) || 0;
    });

    return res.status(200).json({
      success: true,
      date: today,
      summary: {
        totalOrders: todaysOrders.length,
        totalSales: Number(totalSales.toFixed(2)),
        pendingOrders: statusCounts.Pending,
        preparingOrders: statusCounts.Preparing,
        readyOrders: statusCounts.Ready,
        collectedOrders: statusCounts.Collected
      }
    });

  } catch (error) {
    console.error("Daily order summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve daily order summary."
    });
  }
});

// GET /api/orders/:id
// View one order (staff only)
router.get("/:id", authenticateStaff, async (req, res) => {
  try {
    const order = await redis.get(`order:${req.params.id}`);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve order."
    });
  }
});

// POST /api/orders
// Place a customer order
router.post("/", async (req, res) => {
  try {
    const { customerName, items } = req.body;

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a customer name and at least one item."
      });
    }

    for (const item of items) {
      if (
        !item ||
        typeof item.menuItemId !== "string" ||
        !item.menuItemId.trim() ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid menuItemId and quantity."
        });
      }
    }

    const orderItems = [];

    for (const requestedItem of items) {
      const menuItem = await redis.get(
        `menu:${requestedItem.menuItemId}`
      );

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item ${requestedItem.menuItemId} was not found.`
        });
      }

      if (menuItem.available !== true) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable.`
        });
      }

      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: requestedItem.quantity,
        subtotal: menuItem.price * requestedItem.quantity
      });
    }

    const total = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const orderId = randomUUID();

    const newOrder = {
      id: orderId,
      orderNumber: `ORD-${Date.now()}`,
      customerName: customerName.trim(),
      items: orderItems,
      total: Number(total.toFixed(2)),
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    await redis.set(`order:${orderId}`, newOrder);
    await redis.sadd(ORDER_IDS_KEY, orderId);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: newOrder
    });
  } catch (error) {
    console.error("Place order error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not place your order."
    });
  }
});

// PATCH /api/orders/:id/status
// Change order status (staff only)
router.patch("/:id/status", authenticateStaff, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Choose Pending, Preparing, Ready or Collected."
      });
    }

    const order = await redis.get(`order:${orderId}`);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    await redis.set(`order:${orderId}`, order);

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update order status."
    });
  }
});

module.exports = router;
