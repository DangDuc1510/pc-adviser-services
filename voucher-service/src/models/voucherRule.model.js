const mongoose = require('mongoose');

const voucherRuleSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Trigger Configuration - Chỉ 4 loại cố định
  triggerType: {
    type: String,
    enum: [
      'user_registered',      // Lần đầu đăng ký tài khoản
      'spending_milestone',   // Đạt mốc chi tiêu
      'birthday',             // Sinh nhật
      'inactivity_days'       // Không hoạt động X ngày
    ],
    required: true,
    index: true
  },
  triggerConfig: {
    // For inactivity_days - số ngày không hoạt động (mặc định 30)
    days: {
      type: Number,
      min: 1,
      default: 30
    },
    
    // For spending_milestone - mốc chi tiêu (mặc định 20,000,000)
    amount: {
      type: Number,
      min: 0,
      default: 20000000
    }
  },
  
  // Voucher Template
  voucherTemplate: {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      min: 0
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    validityDays: {
      type: Number,
      required: true,
      min: 1
    },
    usageLimitPerUser: {
      type: Number,
      min: 1
    },
    applicableTo: {
      type: String,
      enum: ['all', 'categories', 'products', 'brands'],
      default: 'all'
    },
    categoryIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    brandIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand'
    }]
  },
  
  // Metadata
  // Note: createdBy and updatedBy are ObjectIds referencing users in identity-service
  // They are not populated as User model doesn't exist in voucher-service
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
voucherRuleSchema.index({ isActive: 1, triggerType: 1 });

module.exports = mongoose.model('VoucherRule', voucherRuleSchema);

