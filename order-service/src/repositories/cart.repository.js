const Cart = require("../models/cart.model");

class CartRepository {
  // Find cart by userId
  async findByUserId(userId) {
    return await Cart.findOne({ userId });
  }

  // Create new cart
  async create(cartData) {
    const cart = new Cart(cartData);
    return await cart.save();
  }

  // Update cart
  async update(cartId, updateData) {
    return await Cart.findByIdAndUpdate(cartId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  // Delete cart
  async delete(cartId) {
    return await Cart.findByIdAndDelete(cartId);
  }

  // Delete cart by userId
  async deleteByUserId(userId) {
    return await Cart.deleteOne({ userId });
  }
}

module.exports = new CartRepository();
