const mongoose = require("mongoose");
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require("../constants");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        name: { type: String, required: true },
        slug: String,
        image: String,
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      shippingCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    coupon: {
      code: String,
      name: String,
      discountType: String,
      discountValue: Number,
      discount: Number,
    },
    shippingInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    customerNote: String,
    payment: {
      method: {
        type: String,
        enum: Object.values(PAYMENT_METHOD),
        default: PAYMENT_METHOD.VNPAY,
      },
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
      },
      transactionId: String,
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING_PAYMENT,
      index: true,
    },
    customer: {
      email: String,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ "payment.status": 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "customer.email": 1 });

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    const timestamp = Date.now().toString().slice(-8);
    this.orderNumber = `ORD${timestamp}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
