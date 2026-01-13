const cartService = require("../services/cart.service");

// Get cart
const getCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Vui lòng đăng nhập để xem giỏ hàng",
      });
    }

    const cart = await cartService.getCart(userId);

    res.json({
      status: "success",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
const addItem = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng",
      });
    }

    const { productId, quantity } = req.body;

    const cart = await cartService.addItem(userId, {
      productId,
      quantity,
    });

    res.status(201).json({
      status: "success",
      message: "Đã thêm sản phẩm vào giỏ hàng",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Update item quantity
const updateItem = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Vui lòng đăng nhập để cập nhật giỏ hàng",
      });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateItemQuantity(
      userId,
      productId,
      quantity
    );

    res.json({
      status: "success",
      message: "Đã cập nhật giỏ hàng",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
const removeItem = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng",
      });
    }

    const { productId } = req.params;

    const cart = await cartService.removeItem(userId, productId);

    res.json({
      status: "success",
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Clear cart
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Vui lòng đăng nhập để xóa giỏ hàng",
      });
    }

    const cart = await cartService.clearCart(userId);

    res.json({
      status: "success",
      message: "Đã xóa toàn bộ giỏ hàng",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Get cart summary
const getCartSummary = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Vui lòng đăng nhập để xem tóm tắt giỏ hàng",
      });
    }

    const summary = await cartService.getCartSummary(userId);

    res.json({
      status: "success",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  getCartSummary,
};
