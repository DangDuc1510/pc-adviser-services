const mongoose = require('mongoose');

const voucherDistributionSchema = new mongoose.Schema({
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VoucherRule',
    required: true,
    index: true
  },
  // Note: userId and customerId are ObjectIds referencing users/customers in identity-service
  // They are not populated as User/Customer models don't exist in voucher-service
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  promoCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
    required: true,
    index: true
  },
  triggerType: {
    type: String,
    required: true,
    enum: [
      'user_registered',      // Lần đầu đăng ký tài khoản
      'spending_milestone',   // Đạt mốc chi tiêu
      'birthday',             // Sinh nhật
      'inactivity_days'       // Không hoạt động X ngày
    ],
    index: true
  },
  triggerData: {
    type: mongoose.Schema.Types.Mixed,
    // Stores additional data about the trigger:
    // - birthday: { date: Date }
    // - inactivity_days: { days: Number }
    // - spending_milestone: { amount: Number }
    // - order_count: { count: Number }
    // - segmentation: { oldType: String, newType: String }
  },
  distributedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'used', 'expired'],
    default: 'pending',
    index: true
  },
  sentAt: {
    type: Date
  },
  usedAt: {
    type: Date
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  expiredAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
voucherDistributionSchema.index({ userId: 1, status: 1 });
voucherDistributionSchema.index({ ruleId: 1, distributedAt: -1 });
voucherDistributionSchema.index({ status: 1, distributedAt: -1 });
voucherDistributionSchema.index({ promoCodeId: 1 });

// Method to mark as sent
voucherDistributionSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Method to mark as used
voucherDistributionSchema.methods.markAsUsed = function(orderId) {
  this.status = 'used';
  this.usedAt = new Date();
  if (orderId) {
    this.orderId = orderId;
  }
  return this.save();
};

// Method to mark as expired
voucherDistributionSchema.methods.markAsExpired = function() {
  this.status = 'expired';
  this.expiredAt = new Date();
  return this.save();
};

module.exports = mongoose.model('VoucherDistribution', voucherDistributionSchema);

