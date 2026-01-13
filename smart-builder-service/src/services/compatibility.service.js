const productClient = require('../clients/product.client');
const { calculateCompatibilityScore, calculatePriceScore, calculateBrandScore, calculateFinalScore } = require('../utils/scoring');
const { productMatchesComponentType, getCategoryNamesForComponent } = require('../utils/componentMapping');
const recommendationConfig = require('../utils/recommendation-config');
const logger = require('../utils/logger');

/**
 * Get compatible component recommendations
 */
class CompatibilityService {
  async getCompatibleRecommendations(options) {
    const { componentType, currentComponents = [], buildId } = options;
    logger.info('[CompatibilityService] Starting compatible recommendations', {
      componentType,
      currentComponentsCount: currentComponents.length,
      buildId
    });

    // Extract compatibility requirements from current components
    const requirements = this.extractRequirements(currentComponents);
    logger.debug('[CompatibilityService] Extracted requirements', {
      requirements,
      componentType
    });

    // Get products of the requested component type
    const filters = {
      status: recommendationConfig.PRODUCT_FILTERING.REQUIRED_STATUS,
      isActive: recommendationConfig.PRODUCT_FILTERING.REQUIRED_ACTIVE,
      limit: recommendationConfig.COMPATIBILITY.PRODUCT_FETCH_LIMIT, // Get more to filter properly
    };

    logger.debug('[CompatibilityService] Fetching products from Product Service', { filters });
    const fetchStartTime = Date.now();
    const productsResponse = await productClient.getProducts(filters);
    const fetchDuration = Date.now() - fetchStartTime;
    let products = Array.isArray(productsResponse) ? productsResponse : (productsResponse.products || []);
    logger.info('[CompatibilityService] Fetched products', {
      count: products.length,
      duration: `${fetchDuration}ms`
    });

    // Filter by component type
    if (componentType) {
      const beforeFilter = products.length;
      products = products.filter(product => 
        productMatchesComponentType(product, componentType)
      );
      logger.debug('[CompatibilityService] Filtered by component type', {
        beforeFilter,
        afterFilter: products.length,
        componentType
      });
    }

    // Filter and score products
    const recommendations = [];
    let incompatibleCount = 0;
    let scoredCount = 0;
    
    logger.debug('[CompatibilityService] Starting to score products', {
      totalProducts: products.length
    });

    for (const product of products) {
      const compatibility = this.checkCompatibility(product, requirements, componentType);
      const compatibilityScore = calculateCompatibilityScore(compatibility);
      
      if (compatibilityScore === 0) {
        incompatibleCount++;
        logger.debug('[CompatibilityService] Product incompatible, skipping', {
          productId: product._id?.toString(),
          compatibility
        });
        continue; // Skip incompatible products
      }
      
      const scores = {
        compatibility: compatibilityScore,
        price: calculatePriceScore(
          product.pricing?.salePrice || product.pricing?.originalPrice || 0,
          requirements.budgetMin,
          requirements.budgetMax
        ),
        brand: calculateBrandScore(product.brandId?.toString(), requirements.brandPreferences),
        popularity: (product.views || 0) / recommendationConfig.POPULARITY.COMPATIBILITY_NORMALIZATION, // Normalize popularity
      };
      
      const weights = recommendationConfig.COMPATIBILITY.SCORING_WEIGHTS;
      const finalScore = calculateFinalScore(scores, {
        compatibility: weights.compatibility,
        price: weights.price,
        brand: weights.brand,
        popularity: weights.popularity,
      });
      
      scoredCount++;
      logger.debug('[CompatibilityService] Product scored', {
        productId: product._id?.toString(),
        productName: product.name,
        scores,
        finalScore,
        compatibility
      });
      
      recommendations.push({
        productId: product._id,
        product,
        score: finalScore,
        compatibility,
        reasons: this.generateReasons(product, compatibility, requirements),
        scores
      });
    }

    logger.info('[CompatibilityService] Scoring completed', {
      totalProducts: products.length,
      incompatibleCount,
      scoredCount,
      recommendationsCount: recommendations.length
    });

    // Sort by score and return top 10
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations.slice(0, 10);
    
    logger.info('[CompatibilityService] Returning top recommendations', {
      componentType,
      topCount: topRecommendations.length,
      topScores: topRecommendations.map(r => ({
        productId: r.productId?.toString(),
        score: r.score
      }))
    });
    
    return {
      componentType,
      recommendations: topRecommendations,
      filters: requirements
    };
  }

  extractRequirements(components) {
    logger.debug('[CompatibilityService] Extracting requirements from components', {
      componentsCount: components.length
    });

    const requirements = {
      socket: null,
      ramType: null,
      formFactor: null,
      powerRequirement: 0,
      budgetMin: null,
      budgetMax: null,
      brandPreferences: null
    };

    for (const component of components) {
      const product = component.product || component;
      const specs = product.specifications || {};
      
      // CPU socket requirement for motherboard
      if (specs.socket) {
        requirements.socket = specs.socket;
        logger.debug('[CompatibilityService] Found socket requirement', {
          socket: specs.socket,
          componentType: component.type
        });
      }
      
      // RAM type requirement for motherboard
      if (specs.type && component.type === 'ram') {
        requirements.ramType = specs.type;
        logger.debug('[CompatibilityService] Found RAM type requirement', {
          ramType: specs.type
        });
      }
      
      // Form factor requirement for case
      if (specs.formFactor && component.type === 'motherboard') {
        requirements.formFactor = specs.formFactor;
        logger.debug('[CompatibilityService] Found form factor requirement', {
          formFactor: specs.formFactor
        });
      }
      
      // Power requirement for PSU
      if (specs.powerConsumption || specs.tdp) {
        const power = parseInt(specs.powerConsumption || specs.tdp) || 0;
        requirements.powerRequirement += power;
        logger.debug('[CompatibilityService] Found power requirement', {
          power,
          componentType: component.type,
          totalPower: requirements.powerRequirement
        });
      }
    }

    // Add overhead for power requirement
    if (requirements.powerRequirement > 0) {
      const beforeOverhead = requirements.powerRequirement;
      requirements.powerRequirement = Math.ceil(
        requirements.powerRequirement *
          (1 + recommendationConfig.COMPATIBILITY.POWER_OVERHEAD)
      );
      logger.debug('[CompatibilityService] Applied power overhead', {
        beforeOverhead,
        afterOverhead: requirements.powerRequirement
      });
    }

    logger.info('[CompatibilityService] Requirements extracted', { requirements });
    return requirements;
  }

  checkCompatibility(product, requirements, componentType) {
    const compatibility = {};
    const specs = product.specifications || {};

    // Socket compatibility (for motherboard)
    if (requirements.socket && componentType === 'motherboard') {
      compatibility.socket = specs.socket === requirements.socket ? 'match' : 'mismatch';
    }

    // RAM type compatibility (for motherboard)
    if (requirements.ramType && componentType === 'motherboard') {
      const supportedRamTypes = specs.ramTypes || [];
      compatibility.ramType = supportedRamTypes.includes(requirements.ramType) ? 'match' : 'mismatch';
    }

    // Form factor compatibility (for case)
    if (requirements.formFactor && componentType === 'case') {
      const supportedFormFactors = specs.supportedFormFactors || [];
      compatibility.formFactor = supportedFormFactors.includes(requirements.formFactor) ? 'match' : 'mismatch';
    }

    // Power requirement (for PSU)
    if (requirements.powerRequirement > 0 && componentType === 'psu') {
      const psuWattage = parseInt(specs.wattage || specs.power) || 0;
      compatibility.power = psuWattage >= requirements.powerRequirement ? 'match' : 'mismatch';
    }

    return compatibility;
  }

  generateReasons(product, compatibility, requirements) {
    const reasons = [];
    
    for (const [key, value] of Object.entries(compatibility)) {
      if (value === 'match') {
        if (key === 'socket') {
          reasons.push(`Socket ${product.specifications?.socket} tương thích với CPU đã chọn`);
        } else if (key === 'ramType') {
          reasons.push(`Hỗ trợ ${requirements.ramType} như RAM bạn đã chọn`);
        } else if (key === 'formFactor') {
          reasons.push(`Form factor ${product.specifications?.formFactor} tương thích với motherboard`);
        } else if (key === 'power') {
          reasons.push(`Công suất ${product.specifications?.wattage || product.specifications?.power}W đủ cho build của bạn`);
        }
      }
    }
    
    return reasons;
  }
}

module.exports = new CompatibilityService();

