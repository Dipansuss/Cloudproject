const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Optional: User preferences
  defaultEncryptionMethod: { type: String, default: 'aes' },
  uploadNotifications: { type: Boolean, default: true },
});
module.exports = mongoose.model("User", UserSchema);
