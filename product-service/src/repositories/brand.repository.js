const createBaseRepository = require('./base.repository');
const Brand = require('../models/brand.model');
const { DatabaseError } = require('../errors');

// Tạo base repository functions cho Brand model
const baseRepo = createBaseRepository(Brand);

// Find brand by slug
const findBySlug = async (slug, options = {}) => {
  return await baseRepo.findOne({ slug }, options);
};

// Check if slug exists (excluding current brand)
const slugExists = async (slug, excludeId = null) => {
  const filter = { slug };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await baseRepo.exists(filter);
};

// Find active brands with product count
const findWithProductCount = async () => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'brandId',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0 // Remove products array to keep response clean
        }
      },
      { $sort: { name: 1 } }
    ];
    
    return await baseRepo.aggregate(pipeline);
  } catch (error) {
    throw new DatabaseError(`Error finding brands with product count: ${error.message}`);
  }
};

// Find brands with active products only
const findWithActiveProducts = async () => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          let: { brandId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$brandId', '$$brandId'] },
                isActive: true,
                status: 'published'
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $match: {
          'products.0': { $exists: true } // Only brands with products
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0
        }
      },
      { $sort: { name: 1 } }
    ];
    
    return await baseRepo.aggregate(pipeline);
  } catch (error) {
    throw new DatabaseError(`Error finding brands with active products: ${error.message}`);
  }
};

// Find brands by country
const findByCountry = async (country, options = {}) => {
  return await baseRepo.find({ 
    country, 
    isActive: true 
  }, {
    sort: { name: 1 },
    ...options
  });
};

// Get brands with pagination and filters
const findWithPagination = async (filter = {}, page = 1, limit = 20, options = {}) => {
  try {
    const skip = (page - 1) * limit;
    const { sort = { name: 1 } } = options;
    
    const [brands, total] = await Promise.all([
      baseRepo.find(filter, { sort, skip, limit }),
      baseRepo.count(filter)
    ]);

    return {
      brands,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new DatabaseError(`Error finding brands with pagination: ${error.message}`);
  }
};

// Search brands by name
const searchByName = async (searchTerm, options = {}) => {
  const { limit = 20 } = options;
  const filter = {
    name: { $regex: searchTerm, $options: 'i' },
    isActive: true
  };
  
  return await baseRepo.find(filter, {
    sort: { name: 1 },
    limit
  });
};

// Find popular brands (brands with most products)
const findPopularBrands = async (limit = 10) => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          let: { brandId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$brandId', '$$brandId'] },
                isActive: true,
                status: 'published'
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $match: {
          productCount: { $gt: 0 }
        }
      },
      {
        $project: {
          products: 0
        }
      },
      { $sort: { productCount: -1 } },
      { $limit: limit }
    ];
    
    return await baseRepo.aggregate(pipeline);
  } catch (error) {
    throw new DatabaseError(`Error finding popular brands: ${error.message}`);
  }
};

// Get brand statistics
const getBrandStats = async (brandId) => {
  try {
    const pipeline = [
      { $match: { _id: brandId } },
      {
        $lookup: {
          from: 'products',
          let: { brandId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$brandId', '$$brandId'] },
                isActive: true,
                status: 'published'
              }
            },
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                averagePrice: { $avg: '$pricing.originalPrice' },
                totalSales: { $sum: '$sales' },
                averageRating: { $avg: '$rating.average' }
              }
            }
          ],
          as: 'stats'
        }
      },
      {
        $addFields: {
          statistics: {
            $cond: {
              if: { $gt: [{ $size: '$stats' }, 0] },
              then: { $arrayElemAt: ['$stats', 0] },
              else: {
                totalProducts: 0,
                averagePrice: 0,
                totalSales: 0,
                averageRating: 0
              }
            }
          }
        }
      },
      {
        $project: {
          stats: 0
        }
      }
    ];
    
    const result = await baseRepo.aggregate(pipeline);
    return result[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error getting brand statistics: ${error.message}`);
  }
};

// Find brands by category (brands that have products in specific category)
const findByCategory = async (categoryId, options = {}) => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          let: { brandId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $and: [
                    { $eq: ['$brandId', '$$brandId'] },
                    { $eq: ['$categoryId', categoryId] }
                  ]
                },
                isActive: true,
                status: 'published'
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $match: {
          'products.0': { $exists: true }
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0
        }
      },
      { $sort: { name: 1 } }
    ];
    
    if (options.limit) {
      pipeline.push({ $limit: options.limit });
    }
    
    return await baseRepo.aggregate(pipeline);
  } catch (error) {
    throw new DatabaseError(`Error finding brands by category: ${error.message}`);
  }
};

module.exports = {
  // Base repository functions
  ...baseRepo,
  
  // Custom brand repository functions
  findBySlug,
  slugExists,
  findWithProductCount,
  findWithActiveProducts,
  findByCountry,
  findWithPagination,
  searchByName,
  findPopularBrands,
  getBrandStats,
  findByCategory
};
