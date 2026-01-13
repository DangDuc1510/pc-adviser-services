const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true, // Allow null for guest users
      unique: true, // Ensure one customer per userId
      index: true,
    },
    ipAddress: {
      type: String,
      index: true,
    },
    userAgent: String,
    customerType: {
      type: String,
      enum: ["registered", "guest"],
      required: true,
      default: "guest",
      index: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      device: {
        type: mongoose.Schema.Types.Mixed,
      },
      location: {
        type: mongoose.Schema.Types.Mixed,
      },
      browser: String,
      os: String,
    },
    segmentation: {
      type: {
        type: String,
        enum: ["potential", "loyal", "at_risk", "churned"],
      },
      score: {
        type: Number,
        min: 0,
        max: 100, // Updated to 0-100 scale (RFM score)
      },
      rfmScore: {
        type: Number,
        min: 0,
        max: 100, // RFM weighted score (R*0.4 + F*0.4 + M*0.2)
      },
      reasons: [String],
      rfm: {
        recency: Number,
        frequency: Number,
        monetary: Number,
        lastActivityDate: Date,
      },
      behavior: {
        recentEventCount: Number,
        engagementScore: Number,
        daysSinceLastActivity: Number,
        recentImportantEventCount: Number,
      },
      lastAnalyzed: Date,
      metadata: {
        totalOrders: Number,
        totalBehaviorEvents: Number,
        daysSinceRegistration: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure userId exists for registered customers
customerSchema.pre("validate", function (next) {
  if (this.customerType === "registered" && !this.userId) {
    next(new Error("userId is required for registered customers"));
  } else {
    next();
  }
});

// Update lastSeenAt on save
customerSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastSeenAt = new Date();
  }
  next();
});

// Indexes
customerSchema.index({ userId: 1, customerType: 1 });
customerSchema.index({ lastSeenAt: -1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ "segmentation.type": 1 });
customerSchema.index({ "segmentation.lastAnalyzed": -1 });

module.exports = mongoose.model("Customer", customerSchema);
