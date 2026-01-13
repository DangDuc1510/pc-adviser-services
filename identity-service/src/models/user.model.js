const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    userName: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role: {
      type: String,
      default: "customer",
      enum: ["customer", "admin", "employee"],
    },
    avatar: { type: String },
    phone: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirth: { type: Date },
    isActive: { type: Boolean, default: true },
    address: { type: String },
    customPermissions: { type: [String], default: [] },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
