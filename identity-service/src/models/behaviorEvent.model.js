const mongoose = require('mongoose');

const behaviorEventSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true
    },
    eventType: {
      type: String,
      enum: [
        'view',
        'click',
        'search',
        'scroll',
        'add_to_cart',
        'remove_from_cart',
        'checkout_start',
        'purchase',
        'navigation'
      ],
      required: true,
      index: true
    },
    entityType: {
      type: String,
      enum: ['product', 'category', 'page', 'search'],
      required: true,
      index: true
    },
    entityId: {
      type: String,
      index: true
    },
    metadata: {
      url: String,
      referrer: String,
      scrollDepth: Number,
      timeOnPage: Number,
      [String]: mongoose.Schema.Types.Mixed // Allow any additional fields
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    sessionId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for common queries
behaviorEventSchema.index({ customerId: 1, timestamp: -1 });
behaviorEventSchema.index({ userId: 1, timestamp: -1 });
behaviorEventSchema.index({ eventType: 1, entityType: 1, timestamp: -1 });
behaviorEventSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
behaviorEventSchema.index({ sessionId: 1, timestamp: -1 });

// TTL index to auto-delete old events after 1 year (optional, can be adjusted)
// behaviorEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('BehaviorEvent', behaviorEventSchema);

