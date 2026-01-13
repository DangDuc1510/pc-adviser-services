const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  logo: { type: String }, // Brand logo URL
  description: { type: String },
  country: { type: String },
  isActive: { type: Boolean, default: true },
  
  // SEO fields
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: [{ type: String }]
}, { timestamps: true });

// Indexes
brandSchema.index({ slug: 1 });
brandSchema.index({ name: 1 });

module.exports = mongoose.model('Brand', brandSchema);
