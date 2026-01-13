const cartRepository = require("../repositories/cart.repository");
const productClient = require("./product-client");
const {
  ValidationError,
  CartNotFoundError,
  InsufficientStockError,
} = require("../errors");

class CartService {
  // Get cart by userId
  async getCart(userId) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    let cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      // Create empty cart
      cart = await cartRepository.create({
        userId,
        items: [],
      });
    }

    return cart;
  }

  // Add item to cart
  async addItem(userId, itemData) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    const { productId, quantity = 1 } = itemData;

    if (!productId) {
      throw new ValidationError("Product ID là bắt buộc");
    }

    if (quantity < 1) {
      throw new ValidationError("Số lượng phải lớn hơn 0");
    }

    // Get or create cart
    let cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      cart = await cartRepository.create({
        userId,
        items: [],
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // Update existing item - only update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item - only store productId and quantity
      cart.items.push({
        productId,
        quantity,
      });
    }

    return await cart.save();
  }

  // Update item quantity
  async updateItemQuantity(userId, productId, quantity) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    if (quantity < 0) {
      throw new ValidationError("Số lượng không hợp lệ");
    }

    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      throw new CartNotFoundError();
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex < 0) {
      throw new ValidationError("Sản phẩm không có trong giỏ hàng");
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity only
      cart.items[itemIndex].quantity = quantity;
    }

    return await cart.save();
  }

  // Remove item from cart
  async removeItem(userId, productId) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      throw new CartNotFoundError();
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex < 0) {
      throw new ValidationError("Sản phẩm không có trong giỏ hàng");
    }

    cart.items.splice(itemIndex, 1);
    return await cart.save();
  }

  // Clear cart
  async clearCart(userId) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      throw new CartNotFoundError();
    }

    cart.items = [];
    return await cart.save();
  }

  // Validate cart before checkout
  async validateCart(userId) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    const cart = await cartRepository.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new ValidationError("Giỏ hàng trống");
    }

    // Check stock for all items
    const stockChecks = await Promise.all(
      cart.items.map((item) =>
        productClient.checkStock(item.productId.toString(), item.quantity)
      )
    );

    const unavailableItems = stockChecks
      .map((check, index) => ({ check, item: cart.items[index] }))
      .filter(({ check }) => !check.available);

    if (unavailableItems.length > 0) {
      // Fetch products to get names for error messages
      const productIds = unavailableItems.map(({ item }) =>
        item.productId.toString()
      );
      const products = await productClient.getProductsByIds(productIds);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const errors = unavailableItems.map(({ check, item }) => {
        const product = productMap.get(item.productId.toString());
        return {
          productId: item.productId,
          productName: product?.name || "Sản phẩm",
          reason: check.reason,
        };
      });

      throw new InsufficientStockError(
        "Một số sản phẩm không đủ hàng: " + JSON.stringify(errors)
      );
    }

    return { valid: true, cart };
  }

  // Get cart summary
  async getCartSummary(userId) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    const cart = await cartRepository.findByUserId(userId);

    if (!cart) {
      return {
        itemCount: 0,
        totalItems: 0,
      };
    }

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      itemCount: cart.items.length,
      totalItems,
    };
  }
}

module.exports = new CartService();
