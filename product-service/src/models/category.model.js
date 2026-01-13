const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  imageUrl: { type: String }, // Category image URL
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, default: 0 }, // 0: root, 1: sub, 2: sub-sub
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  
  // PC Component specific categories
  componentType: {
    type: String,
    enum: [
      'CPU', 'VGA', 'RAM', 'Mainboard', 'Storage', 'PSU', 'Case', 
      'Cooling', 'Monitor', 'Keyboard', 'Mouse', 'Audio', 'Networking', 'Other'
    ]
  },
  
  // SEO fields
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: [{ type: String }]
}, { timestamps: true });

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ componentType: 1 });

module.exports = mongoose.model('Category', categorySchema); 