const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  // Existing fields (keep for backward compatibility)
  originalName: String,
  savedName: String,
  url: String,
  size: Number,
  mimeType: String,
  uploadedAt: Date,
  iv: String,
  encryptionMethod: String,
  encryptedAESKey: String, // Only used when RSA+AES method is selected
  
  // New UploadThing fields
  uploadThingUrl: String,    // URL to the file stored on UploadThing
  uploadThingKey: String,    // Unique key for file identification and deletion
  uploadedBy: String,        // User identifier for tracking uploads
  uploadMethod: {            // Track which upload method was used
    type: String,
    enum: ['traditional', 'uploadthing'],
    default: 'traditional'
  }
});

module.exports = mongoose.model("File", FileSchema);
