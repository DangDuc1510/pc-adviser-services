const mongoose = require('mongoose');

const recommendationResultSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  reasons: [{
    type: String
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const recommendationCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      sparse: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    recommendationType: {
      type: String,
      enum: ['favorites', 'personalized', 'similar', 'compatible'],
      required: true,
      index: true
    },
    componentType: {
      type: String,
      index: true
    },
    results: [recommendationResultSchema],
    generatedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 1800 * 1000); // 30 minutes default
      },
      index: { expireAfterSeconds: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
recommendationCacheSchema.index({ customerId: 1, recommendationType: 1, expiresAt: 1 });
recommendationCacheSchema.index({ userId: 1, recommendationType: 1, expiresAt: 1 });

module.exports = mongoose.model('RecommendationCache', recommendationCacheSchema);

