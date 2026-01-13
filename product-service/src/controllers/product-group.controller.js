const productGroupService = require("../services/product-group.service");

// Get all product groups
const getAll = async (req, res, next) => {
  try {
    const result = await productGroupService.getAllProductGroups(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get product group by ID
const getById = async (req, res, next) => {
  try {
    const group = await productGroupService.getProductGroupById(req.params.id);
    res.json(group);
  } catch (error) {
    next(error);
  }
};

// Create new product group
const create = async (req, res, next) => {
  try {
    // Get userId from token (req.user.id), body, or createdBy
    // Priority: req.user.id (from token) > req.body.userId > req.body.createdBy
    const isAdminOrEmployee =  req.body.role ==='admin' || req.body.role ==='employee';
    const userId = req.user?.id || req.body.userId || req.body.createdBy;
    if (!userId && !isAdminOrEmployee) {
      return res.status(400).json({
        error:
          "userId is required. Please provide authentication token or userId in request body",
      });
    }

    // Get role from token, body, or default to "customer"
    const userRole = req.user?.role || req.body.role || req.body.createdByRole || "customer";
console.log("userRole", userRole);
console.log("userId", userId);
console.log("req.body", req.body);
    const groupData = {
      ...req.body,
      createdBy: userId,
      createdByRole: userRole,
      type: req.body.type || "pc-config", // Default to pc-config for PC configs
    };
    const group = await productGroupService.createProductGroup(groupData);
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

// Update product group
const update = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id || req.body.updatedBy,
    };
    const group = await productGroupService.updateProductGroup(
      req.params.id,
      updateData
    );
    res.json(group);
  } catch (error) {
    next(error);
  }
};

// Delete product group
const deleteGroup = async (req, res, next) => {
  try {
    const result = await productGroupService.deleteProductGroup(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Add product to group
const addProduct = async (req, res, next) => {
  try {
    const group = await productGroupService.addProductToGroup(
      req.params.id,
      req.body
    );
    res.json(group);
  } catch (error) {
    next(error);
  }
};

// Remove product from group
const removeProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const group = await productGroupService.removeProductFromGroup(
      req.params.id,
      productId
    );
    res.json(group);
  } catch (error) {
    next(error);
  }
};

// Update product quantity in group
const updateProductQuantity = async (req, res, next) => {
  try {
    const group = await productGroupService.updateProductQuantityInGroup(
      req.params.id,
      req.body
    );
    res.json(group);
  } catch (error) {
    next(error);
  }
};

// Get public product groups
const getPublic = async (req, res, next) => {
  try {
    const groups = await productGroupService.getPublicProductGroups(req.query);
    res.json(groups);
  } catch (error) {
    next(error);
  }
};

// Get product groups by user
const getByUser = async (req, res, next) => {
  try {
    // Get userId from params, query, or body (frontend can send in any of these)
    const userId =
      req.params.userId || req.query.userId || req.body.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({
        error: "userId is required",
      });
    }
    const result = await productGroupService.getProductGroupsByUser(
      userId,
      req.query
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Toggle product group status
const toggleStatus = async (req, res, next) => {
  try {
    const group = await productGroupService.toggleProductGroupStatus(
      req.params.id
    );
    res.json(group);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteGroup,
  addProduct,
  removeProduct,
  updateProductQuantity,
  getPublic,
  getByUser,
  toggleStatus,
};
