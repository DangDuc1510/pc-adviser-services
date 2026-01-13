const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    intent: String,
    entities: [mongoose.Schema.Types.Mixed],
    confidence: Number,
    sources: [String],
    actions: [mongoose.Schema.Types.Mixed],
    products: [mongoose.Schema.Types.ObjectId],
    tokens: Number,
    model: String,
    responseTime: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  context: {
    purpose: {
      type: String,
      enum: ['general', 'build_help', 'support', 'product_inquiry'],
      default: 'general'
    },
    buildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuildHistory',
      default: null
    },
    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    userProfile: {
      preferences: mongoose.Schema.Types.Mixed,
      previousBuilds: [mongoose.Schema.Types.ObjectId],
      experience: {
        type: String,
        enum: ['beginner', 'intermediate', 'expert'],
        default: 'beginner'
      }
    }
  },
  messages: [messageSchema],
  state: {
    currentTopic: String,
    gatheringInfo: mongoose.Schema.Types.Mixed,
    pendingActions: [mongoose.Schema.Types.Mixed],
    lastIntent: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    helpful: Boolean,
    resolved: Boolean,
    comments: String
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'escalated'],
    default: 'active',
    index: true
  },
  endedAt: Date,
  duration: Number // seconds
}, {
  timestamps: true
});

// Indexes
chatSessionSchema.index({ userId: 1 });
chatSessionSchema.index({ sessionId: 1 }, { unique: true });
chatSessionSchema.index({ status: 1 });
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ 'context.purpose': 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);

