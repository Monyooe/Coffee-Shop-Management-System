
const express = require("express");
const { randomUUID } = require("crypto");
const redis = require("../database");
const authenticateStaff = require("../middleware/auth");

const router = express.Router();

const MENU_IDS_KEY = "menu:ids";

// GET /api/menu
// Display all menu items
router.get("/", async (req, res) => {
  try {
    const ids = await redis.smembers(MENU_IDS_KEY);

    const items = await Promise.all(
      ids.map((id) => redis.get(`menu:${id}`))
    );

    const menu = items.filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      count: menu.length,
      menu
    });
  } catch (error) {
    console.error("Get menu error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve menu items."
    });
  }
});

// GET /api/menu/:id
// Display one menu item
router.get("/:id", async (req, res) => {
  try {
    const item = await redis.get(`menu:${req.params.id}`);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found."
      });
    }

    return res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    console.error("Get menu item error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve menu item."
    });
  }
});

// POST /api/menu
// Add a new menu item (staff only)
router.post("/", authenticateStaff, async (req, res) => {
  try {
    const { name, description, price, category, available } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      (available !== undefined && typeof available !== "boolean")
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid name, description, category and positive price."
      });
    }

    const id = randomUUID();

    const newItem = {
      id,
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      available: available === undefined ? true : available
    };

    await redis.set(`menu:${id}`, newItem);
    await redis.sadd(MENU_IDS_KEY, id);

    return res.status(201).json({
      success: true,
      message: "Menu item added successfully.",
      item: newItem
    });
  } catch (error) {
    console.error("Add menu item error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not add menu item."
    });
  }
});

// PUT /api/menu/:id
// Update an existing menu item (staff only)
router.put("/:id", authenticateStaff, async (req, res) => {
  try {
    const id = req.params.id;
    const existingItem = await redis.get(`menu:${id}`);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found."
      });
    }

    const { name, description, price, category, available } = req.body;

    if (
      (name !== undefined &&
        (typeof name !== "string" || !name.trim())) ||
      (description !== undefined &&
        (typeof description !== "string" || !description.trim())) ||
      (category !== undefined &&
        (typeof category !== "string" || !category.trim())) ||
      (price !== undefined &&
        (typeof price !== "number" || !Number.isFinite(price) || price <= 0)) ||
      (available !== undefined && typeof available !== "boolean")
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid menu item details."
      });
    }

    const updatedItem = {
      ...existingItem,
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(price !== undefined && { price }),
      ...(category !== undefined && { category: category.trim() }),
      ...(available !== undefined && { available })
    };

    await redis.set(`menu:${id}`, updatedItem);

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully.",
      item: updatedItem
    });
  } catch (error) {
    console.error("Update menu item error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update menu item."
    });
  }
});

// DELETE /api/menu/:id
// Delete a menu item (staff only)
router.delete("/:id", authenticateStaff, async (req, res) => {
  try {
    const id = req.params.id;
    const existingItem = await redis.get(`menu:${id}`);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found."
      });
    }

    await redis.del(`menu:${id}`);
    await redis.srem(MENU_IDS_KEY, id);

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully."
    });
  } catch (error) {
    console.error("Delete menu item error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete menu item."
    });
  }
});

module.exports = router;
