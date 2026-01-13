const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema(
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
    preferences: {
      brands: {
        type: Map,
        of: Number,
        default: {}
      },
      categories: {
        type: Map,
        of: Number,
        default: {}
      },
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 }
      },
      colors: [{
        type: String
      }],
      useCases: [{
        type: String
      }]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 3600 * 1000); // 1 hour default
      },
      index: { expireAfterSeconds: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast lookups
userPreferenceSchema.index({ customerId: 1, lastUpdated: -1 });
userPreferenceSchema.index({ userId: 1, lastUpdated: -1 });

module.exports = mongoose.model('UserPreference', userPreferenceSchema);

