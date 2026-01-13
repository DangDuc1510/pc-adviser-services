const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  // Basic Information
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9_-]+$/, 'Code chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Type of promo code
  type: {
    type: String,
    enum: ['public', 'user-specific', 'internal'],
    required: true,
    default: 'public'
  },
  
  // For user-specific codes
  userIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Discount Configuration
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
  
  // Usage Limits
  usageLimit: {
    type: Number,
    min: 1
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageLimitPerUser: {
    type: Number,
    min: 1
  },
  
  // Validity Period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Applicable to
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
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Analytics
  totalDiscountGiven: {
    type: Number,
    default: 0,
    min: 0
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ type: 1, isActive: 1 });
promoCodeSchema.index({ startDate: 1, endDate: 1 });
promoCodeSchema.index({ userIds: 1 });
promoCodeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Virtual for checking if code is valid
promoCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.usageLimit || this.usageCount < this.usageLimit);
});

// Method to check if user can use this code
promoCodeSchema.methods.canBeUsedBy = function(userId) {
  if (!this.isValid) return false;
  
  if (this.type === 'user-specific') {
    return this.userIds.some(id => id.toString() === userId?.toString());
  }
  
  if (this.type === 'internal') {
    // Internal codes can only be used by admins (handled in service layer)
    return false;
  }
  
  return true;
};

// Method to calculate discount
promoCodeSchema.methods.calculateDiscount = function(subtotal) {
  if (subtotal < this.minPurchaseAmount) {
    return 0;
  }
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else {
    discount = this.discountValue;
    if (discount > subtotal) {
      discount = subtotal;
    }
  }
  
  return Math.round(discount);
};

// Pre-save validation
promoCodeSchema.pre('save', function(next) {
  // Ensure endDate is after startDate
  if (this.endDate <= this.startDate) {
    return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }
  
  // Ensure percentage is not more than 100
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Phần trăm giảm giá không được vượt quá 100%'));
  }
  
  next();
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);

