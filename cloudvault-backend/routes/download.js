// routes/download.js
const express = require("express");
const router = express.Router();
const File = require("../models/File");
const path = require("path");

router.get("/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    const filePath = path.join(__dirname, "..", "uploads", file.savedName);

    res.download(filePath, file.originalName); // Sets correct headers
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
