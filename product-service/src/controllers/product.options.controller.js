const { PRODUCT_STATUS, USE_CASES, VALID_COLORS } = require("../constants");
const { CATEGORY_FILTERS_CONFIG } = require("../config/categoryFilters");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const Brand = require("../models/brand.model");
const categoryRepository = require("../repositories/category.repository");
const mongoose = require("mongoose");

// Get use cases options
const getUseCases = async (req, res) => {
  try {
    const useCases = Object.entries(USE_CASES).map(([key, value]) => ({
      label: value,
      value: value,
    }));

    res.json({
      success: true,
      data: useCases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách mục đích sử dụng",
      error: error.message,
    });
  }
};

// Get colors options
const getColors = async (req, res) => {
  try {
    const colorLabels = {
      black: "Đen",
      white: "Trắng",
      gray: "Xám",
      "dark-gray": "Xám đen",
      "light-gray": "Xám nhạt",
      red: "Đỏ",
      blue: "Xanh dương",
      green: "Xanh lá",
      yellow: "Vàng",
      orange: "Cam",
      pink: "Hồng",
      purple: "Tím",
      cyan: "Xanh ngọc",
      brown: "Nâu",
      silver: "Bạc",
      gold: "Vàng đồng",
      rgb: "RGB",
      "rgb-blue": "Xanh RGB",
      "rgb-red": "Đỏ RGB",
      "rgb-green": "Xanh lá RGB",
    };

    const colors = VALID_COLORS.map((value) => ({
      label: colorLabels[value] || value,
      value: value,
    }));

    res.json({
      success: true,
      data: colors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách màu sắc",
      error: error.message,
    });
  }
};

// Get status options
const getStatus = async (req, res) => {
  try {
    const statusLabels = {
      draft: "Bản nháp",
      published: "Đã xuất bản",
      discontinued: "Ngừng sản xuất",
      "coming-soon": "Sắp ra mắt",
    };

    const statuses = Object.values(PRODUCT_STATUS).map((value) => ({
      label: statusLabels[value] || value,
      value: value,
    }));

    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách trạng thái",
      error: error.message,
    });
  }
};

// Get price ranges (segments) for filtering
const getPriceRanges = async (req, res) => {
  try {
    // Define price ranges by segments
    const priceRanges = [
      { label: "Dưới 5 triệu", min: 0, max: 5000000 },
      { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
      { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
      { label: "20 - 30 triệu", min: 20000000, max: 30000000 },
      { label: "30 - 50 triệu", min: 30000000, max: 50000000 },
      { label: "Trên 50 triệu", min: 50000000, max: null },
    ];

    res.json({
      success: true,
      data: priceRanges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách khoảng giá",
      error: error.message,
    });
  }
};

// Get category-specific filters (sub-filters)
const getCategoryFilters = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID là bắt buộc",
      });
    }

    // Get category to determine componentType
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh mục",
      });
    }

    const componentType = category.componentType;
    if (!componentType || !CATEGORY_FILTERS_CONFIG[componentType]) {
      return res.json({
        success: true,
        data: {
          filters: [],
          componentType: componentType || null,
        },
      });
    }

    // Get filter config for this component type
    const filterConfigs = CATEGORY_FILTERS_CONFIG[componentType];

    // Get all descendant category IDs (including the category itself and all its children)
    let categoryIdsToQuery = [categoryId];
    try {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        const descendantIds = await categoryRepository.getAllDescendantIds(
          categoryId
        );
        categoryIdsToQuery = descendantIds.map((id) => id.toString());
      }
    } catch (error) {
      console.error("Error getting descendant category IDs:", error.message);
      // Fallback to original categoryId if error occurs
    }

    // Query products in this category and all its subcategories to get unique values
    // Select only specifications field to optimize query
    const products = await Product.find(
      {
        categoryId:
          categoryIdsToQuery.length === 1
            ? categoryIdsToQuery[0]
            : { $in: categoryIdsToQuery },
        isActive: true,
        status: "published",
      },
      { specifications: 1, _id: 0 }
    ).lean();

    // Build filter options for each filter config
    const filters = await Promise.all(
      filterConfigs.map(async (config) => {
        const values = new Set();

        // Extract unique values from products
        products.forEach((product) => {
          // Skip if product doesn't have specifications
          if (!product || !product.specifications) {
            return;
          }

          const fieldPath = config.field.split(".");
          let value = product;

          // Navigate through the field path
          for (const path of fieldPath) {
            // Check if value exists and is an object/array before accessing property
            if (value != null && typeof value === "object" && path in value) {
              value = value[path];
            } else {
              value = null;
              break;
            }
          }

          // Add value(s) to set if valid
          if (value != null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((v) => {
                if (v != null && v !== undefined && v !== "") {
                  values.add(String(v));
                }
              });
            } else if (value !== "") {
              values.add(String(value));
            }
          }
        });

        // Convert to sorted array
        let options = Array.from(values)
          .filter((v) => v.trim() !== "")
          .sort();

        // For range type, calculate min/max
        if (config.type === "range") {
          const numericValues = options
            .map((v) => parseFloat(v))
            .filter((v) => !isNaN(v))
            .sort((a, b) => a - b);

          if (numericValues.length > 0) {
            return {
              key: config.key,
              label: config.label,
              type: config.type,
              min: numericValues[0],
              max: numericValues[numericValues.length - 1],
              step: numericValues.length > 1 ? 1 : undefined,
            };
          }
        }

        // For multi-select, return options array
        return {
          key: config.key,
          label: config.label,
          type: config.type,
          options: options.map((value) => ({
            label: value,
            value: value,
          })),
        };
      })
    );

    res.json({
      success: true,
      data: {
        filters,
        componentType,
        categoryName: category.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách bộ lọc theo danh mục",
      error: error.message,
    });
  }
};

// Get all filter options in one API call
const getAllFilterOptions = async (req, res) => {
  try {
    const { categoryId } = req.query;

    // Get all filter options in parallel
    const [
      categories,
      brands,
      useCases,
      colors,
      statuses,
      priceRanges,
      categoryFilters,
    ] = await Promise.all([
      // Categories - only level 0 (root categories)
      Category.find({ isActive: true })
        .select("_id name slug")
        .sort({ sortOrder: 1, name: 1 })
        .lean(),

      // Brands
      Brand.find({ isActive: true })
        .select("_id name slug")
        .sort({ name: 1 })
        .lean(),

      // Use Cases
      Promise.resolve(
        Object.entries(USE_CASES).map(([key, value]) => ({
          label: value,
          value: value,
        }))
      ),

      // Colors
      Promise.resolve(
        (() => {
          const colorLabels = {
            black: "Đen",
            white: "Trắng",
            gray: "Xám",
            "dark-gray": "Xám đen",
            "light-gray": "Xám nhạt",
            red: "Đỏ",
            blue: "Xanh dương",
            green: "Xanh lá",
            yellow: "Vàng",
            orange: "Cam",
            pink: "Hồng",
            purple: "Tím",
            cyan: "Xanh ngọc",
            brown: "Nâu",
            silver: "Bạc",
            gold: "Vàng đồng",
            rgb: "RGB",
            "rgb-blue": "Xanh RGB",
            "rgb-red": "Đỏ RGB",
            "rgb-green": "Xanh lá RGB",
          };

          return VALID_COLORS.map((value) => ({
            label: colorLabels[value] || value,
            value: value,
          }));
        })()
      ),

      // Status
      Promise.resolve(
        (() => {
          const statusLabels = {
            draft: "Bản nháp",
            published: "Đã xuất bản",
            discontinued: "Ngừng sản xuất",
            "coming-soon": "Sắp ra mắt",
          };

          return Object.values(PRODUCT_STATUS).map((value) => ({
            label: statusLabels[value] || value,
            value: value,
          }));
        })()
      ),

      // Price Ranges
      Promise.resolve([
        { label: "Dưới 5 triệu", min: 0, max: 5000000 },
        { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
        { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
        { label: "20 - 30 triệu", min: 20000000, max: 30000000 },
        { label: "30 - 50 triệu", min: 30000000, max: 50000000 },
        { label: "Trên 50 triệu", min: 50000000, max: null },
      ]),

      // Category Filters (if categoryId provided)
      (async () => {
        if (!categoryId) {
          return { filters: [], componentType: null, categoryName: null };
        }

        try {
          // Validate ObjectId
          const mongoose = require("mongoose");
          if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return { filters: [], componentType: null, categoryName: null };
          }

          // Get category to determine componentType
          const firstCategory = await Category.findById(categoryId);
          if (!firstCategory) {
            return { filters: [], componentType: null, categoryName: null };
          }

          const componentType = firstCategory.componentType;
          if (!componentType || !CATEGORY_FILTERS_CONFIG[componentType]) {
            return {
              filters: [],
              componentType: componentType || null,
              categoryName: firstCategory.name,
            };
          }

          const filterConfigs = CATEGORY_FILTERS_CONFIG[componentType];

          // Get all descendant category IDs (including the category itself and all its children)
          let categoryIdsToQuery = [categoryId];
          try {
            if (mongoose.Types.ObjectId.isValid(categoryId)) {
              const descendantIds =
                await categoryRepository.getAllDescendantIds(categoryId);
              categoryIdsToQuery = descendantIds.map((id) => id.toString());
            }
          } catch (error) {
            console.error(
              "Error getting descendant category IDs:",
              error.message
            );
            // Fallback to original categoryId if error occurs
          }

          // Query products from selected category and all its subcategories
          // Select only specifications field to optimize query
          const products = await Product.find(
            {
              categoryId:
                categoryIdsToQuery.length === 1
                  ? categoryIdsToQuery[0]
                  : { $in: categoryIdsToQuery },
              isActive: true,
              status: "published",
            },
            { specifications: 1, _id: 0 }
          ).lean();

          const filters = await Promise.all(
            filterConfigs.map(async (config) => {
              const values = new Set();

              products.forEach((product) => {
                // Skip if product doesn't have specifications
                if (!product || !product.specifications) {
                  return;
                }

                const fieldPath = config.field.split(".");
                let value = product;

                // Navigate through the field path
                for (const path of fieldPath) {
                  // Check if value exists and is an object/array before accessing property
                  if (
                    value != null &&
                    typeof value === "object" &&
                    path in value
                  ) {
                    value = value[path];
                  } else {
                    value = null;
                    break;
                  }
                }

                // Add value(s) to set if valid
                if (value != null && value !== undefined) {
                  if (Array.isArray(value)) {
                    value.forEach((v) => {
                      if (v != null && v !== undefined && v !== "") {
                        values.add(String(v));
                      }
                    });
                  } else if (value !== "") {
                    values.add(String(value));
                  }
                }
              });

              let options = Array.from(values)
                .filter((v) => v.trim() !== "")
                .sort();

              if (config.type === "range") {
                const numericValues = options
                  .map((v) => parseFloat(v))
                  .filter((v) => !isNaN(v))
                  .sort((a, b) => a - b);

                if (numericValues.length > 0) {
                  return {
                    key: config.key,
                    label: config.label,
                    type: config.type,
                    min: numericValues[0],
                    max: numericValues[numericValues.length - 1],
                    step: numericValues.length > 1 ? 1 : undefined,
                  };
                }
              }

              return {
                key: config.key,
                label: config.label,
                type: config.type,
                options: options.map((value) => ({
                  label: value,
                  value: value,
                })),
              };
            })
          );

          return {
            filters,
            componentType,
            categoryName: firstCategory.name,
          };
        } catch (error) {
          return { filters: [], componentType: null, categoryName: null };
        }
      })(),
    ]);

    res.json({
      success: true,
      data: {
        categories,
        brands,
        useCases,
        colors,
        statuses,
        priceRanges,
        categoryFilters,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách bộ lọc",
      error: error.message,
    });
  }
};

module.exports = {
  getUseCases,
  getColors,
  getStatus,
  getPriceRanges,
  getCategoryFilters,
  getAllFilterOptions,
};
