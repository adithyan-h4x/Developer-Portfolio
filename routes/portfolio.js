const express = require("express");
const router = express.Router();
const PortfolioItem = require("../models/PortfolioItem");
const User = require("../models/User");

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Get portfolio items for logged in user
router.get("/items", async (req, res) => {
  try {
    const targetUserId = req.session && req.session.userId;
    if (!targetUserId) {
      return res.json({ items: [] });
    }

    const items = await PortfolioItem.find({ user: targetUserId }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items: " + err.message });
  }
});

// Create a portfolio item
router.post("/items", requireAuth, async (req, res) => {
  try {
    const { category, title, subtitle, date, link, description, featured } = req.body;
    if (!category || !title || !description) {
      return res.status(400).json({ error: "Category, title, and description are required" });
    }

    const validCategories = ["Project", "Skill", "Academic", "Certification"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category selected" });
    }

    const item = new PortfolioItem({
      user: req.session.userId,
      category,
      title: title.trim(),
      subtitle: (subtitle && subtitle.trim()) || "",
      date: (date && date.trim()) || "",
      link: (link && link.trim()) || "",
      description: description.trim(),
      featured: Boolean(featured)
    });

    await item.save();
    res.status(201).json({ message: "Portfolio record created successfully", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create item: " + err.message });
  }
});

// Update an existing portfolio item
router.put("/items/:id", requireAuth, async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Record not found" });
    }
    if (item.user.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { category, title, subtitle, date, link, description, featured } = req.body;
    if (category) item.category = category;
    if (title) item.title = title.trim();
    if (subtitle !== undefined) item.subtitle = subtitle.trim();
    if (date !== undefined) item.date = date.trim();
    if (link !== undefined) item.link = link.trim();
    if (description) item.description = description.trim();
    if (featured !== undefined) item.featured = Boolean(featured);

    await item.save();
    res.json({ message: "Portfolio record updated successfully", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update item: " + err.message });
  }
});

// Delete a portfolio item
router.delete("/items/:id", requireAuth, async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Record not found" });
    }
    if (item.user.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    await PortfolioItem.deleteOne({ _id: req.params.id });
    res.json({ message: "Portfolio record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item: " + err.message });
  }
});

module.exports = router;
