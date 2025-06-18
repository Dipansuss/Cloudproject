const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Enhanced CORS configuration for UploadThing
app.use(
  cors({
    origin: ["http://localhost:3000", "https://uploadthing.com", "https://utfs.io"],
    methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-uploadthing-version",
      "x-uploadthing-api-key",
      "x-uploadthing-package",
      "uploadthing-hook",
      "x-uploadthing-signature",
    ],
  })
);

app.options('/*', cors()); // Enable preflight requests

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route imports
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const downloadRoutes = require("./routes/download");
const uploadthingRoutes = require("./routes/uploadthing");

// Route usage
app.use("/api/auth", authRoutes);
app.use("/api/files", uploadRoutes);
app.use("/api/files/download", downloadRoutes);
app.use("/api", uploadthingRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
