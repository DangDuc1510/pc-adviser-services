const mongoose = require('mongoose');

const chatKnowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['product', 'compatibility', 'troubleshooting', 'general', 'build_guide'],
    required: true
  },
  subcategory: String,
  tags: [String],
  keywords: [String],
  
  // Vector embedding for semantic search
  embedding: [Number],
  
  // Related entities
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  brandIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  usage: {
    accessCount: {
      type: Number,
      default: 0
    },
    lastAccessed: Date,
    effectiveness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },
  
  source: {
    type: {
      type: String,
      enum: ['manual', 'scraped', 'generated'],
      default: 'manual'
    },
    url: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Indexes
chatKnowledgeBaseSchema.index({ category: 1, subcategory: 1 });
chatKnowledgeBaseSchema.index({ tags: 1 });
chatKnowledgeBaseSchema.index({ keywords: 1 });
chatKnowledgeBaseSchema.index({ status: 1 });
chatKnowledgeBaseSchema.index({ 'usage.accessCount': -1 });

// Text search index
chatKnowledgeBaseSchema.index({
  title: 'text',
  content: 'text',
  keywords: 'text'
});

module.exports = mongoose.model('ChatKnowledgeBase', chatKnowledgeBaseSchema);

