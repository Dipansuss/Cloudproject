const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const File = require("../models/File");

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  const { encryptionMethod } = req.body;
  try {
    const newFile = new File({
      originalName: req.file.originalname,
      savedName: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      encryptionMethod,
    });

    await newFile.save();
    res.status(201).json({ message: "File uploaded successfully." });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed." });
  }
});

// List files
router.get("/", async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch files." });
  }
});

// Delete file
router.delete("/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found." });

    const filePath = path.join(__dirname, "..", "uploads", file.savedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await file.deleteOne();
    res.json({ message: "File deleted successfully." });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Delete failed." });
  }
});

// Compress file endpoint
router.post("/compress/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found." });

    const originalFilePath = path.join(__dirname, "..", "uploads", file.savedName);
    const zipFileName = `${file.originalName}.zip`;
    const zipFilePath = path.join(__dirname, "..", "uploads", zipFileName);

    // If ZIP file already exists, delete it to avoid conflicts
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
    }

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      res.json({ downloadUrl: `/uploads/${zipFileName}` });
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.file(originalFilePath, { name: file.originalName });
    archive.finalize();
  } catch (err) {
    console.error("Compression error:", err);
    res.status(500).json({ message: "Compression failed." });
  }
});

module.exports = router;


