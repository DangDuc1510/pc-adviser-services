const mongoose = require("mongoose");

// Product Item Schema - only product id, category level 0 id and quantity
const productItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    categoryLevel0Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

// Product Group Schema
const productGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    shortDescription: {
      type: String,
      maxlength: 500,
    },

    // only product id and category level 0 id and quantity
    products: [productItemSchema],

    // Type: combo or build-pc
    type: {
      type: String,
      enum: ["combo", "pc-config"],
      default: "pc-config",
      required: true,
    },

    // Status & Visibility
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Analytics
    views: {
      type: Number,
      default: 0,
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdByRole: {
      type: String,
      enum: ["customer", "admin", "employee"],
      default: "customer",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
productGroupSchema.index({ name: 1 });
productGroupSchema.index({ type: 1 });
productGroupSchema.index({ isActive: 1 });
productGroupSchema.index({ createdAt: -1 });
productGroupSchema.index({ views: -1 });
productGroupSchema.index({ createdByRole: 1 });
productGroupSchema.index({ createdBy: 1, createdByRole: 1 });

// Text index for search
productGroupSchema.index({
  name: "text",
  description: "text",
  shortDescription: "text",
});

module.exports = mongoose.model("ProductGroup", productGroupSchema);
