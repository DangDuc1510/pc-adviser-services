const mongoose = require("mongoose");

// Minimal User schema for product-service
// This is used only for populating references, not for creating/updating users
// The actual User model is in identity-service
const userSchema = new mongoose.Schema(
  {
    email: { type: String },
    userName: { type: String },
    role: {
      type: String,
      enum: ["customer", "admin", "employee"],
    },
    avatar: { type: String },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

// Only register if not already registered
if (!mongoose.models.User) {
  module.exports = mongoose.model("User", userSchema);
} else {
  module.exports = mongoose.models.User;
}
