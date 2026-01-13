const recommendationConfig = require("./recommendation-config");

/**
 * Calculate interaction score based on event types
 * Negative weights indicate events that reduce recommendation score
 */
const INTERACTION_WEIGHTS = recommendationConfig.INTERACTION_WEIGHTS;

/**
 * Calculate product favorite score
 * @param {Object} interactions - Interaction counts
 * @param {Date} lastInteraction - Last interaction timestamp
 * @param {Number} timeWindowDays - Time window in days
 * @returns {Number} Score
 */
function calculateFavoriteScore(
  interactions,
  lastInteraction,
  timeWindowDays = null
) {
  const defaultTimeWindow =
    recommendationConfig.TIME_WINDOWS.FAVORITE_PRODUCTS_DAYS;
  const timeWindow = timeWindowDays || defaultTimeWindow;
  const recencyMultiplier = recommendationConfig.FAVORITE.RECENCY_MULTIPLIER;

  const now = new Date();
  const daysAgo = Math.floor(
    (now - new Date(lastInteraction)) / (1000 * 60 * 60 * 24)
  );

  // Base score from interactions
  let baseScore = 0;
  for (const [eventType, count] of Object.entries(interactions)) {
    const weight = INTERACTION_WEIGHTS[eventType] || 0;
    baseScore += count * weight;
  }

  // Recency multiplier
  const recencyMultiplierValue =
    1 + (1 - daysAgo / timeWindow) * recencyMultiplier;

  return baseScore * recencyMultiplierValue;
}

/**
 * Calculate compatibility score
 * @param {Object} compatibility - Compatibility checks
 * @returns {Number} Score (0-100)
 */
function calculateCompatibilityScore(compatibility) {
  const checks = Object.values(compatibility);
  if (checks.length === 0) return 0;

  const passed = checks.filter(
    (check) => check === "match" || check === true
  ).length;
  return Math.round((passed / checks.length) * 100);
}

/**
 * Calculate price appropriateness score
 * @param {Number} productPrice - Product price
 * @param {Number} budgetMin - Minimum budget
 * @param {Number} budgetMax - Maximum budget
 * @returns {Number} Score (0-100)
 */
function calculatePriceScore(productPrice, budgetMin, budgetMax) {
  const neutralScore = recommendationConfig.SCORING.NEUTRAL_SCORE;
  if (!budgetMin && !budgetMax) return neutralScore; // Neutral if no budget

  if (budgetMin && productPrice < budgetMin) {
    const ratio = productPrice / budgetMin;
    return Math.max(0, Math.round(ratio * 50)); // Lower score if below min
  }

  if (budgetMax && productPrice > budgetMax) {
    const ratio = budgetMax / productPrice;
    return Math.max(0, Math.round(ratio * 50)); // Lower score if above max
  }

  // Within budget range
  if (budgetMin && budgetMax) {
    const range = budgetMax - budgetMin;
    const position = (productPrice - budgetMin) / range;
    // Best score at middle of range
    const distanceFromMiddle = Math.abs(position - 0.5);
    return Math.round(100 - distanceFromMiddle * 40);
  }

  return 100;
}

/**
 * Calculate brand preference score
 * @param {String} brand - Product brand
 * @param {Object} userBrandPreferences - User brand preferences map
 * @returns {Number} Score (0-100)
 */
function calculateBrandScore(brand, userBrandPreferences) {
  const neutralScore = recommendationConfig.SCORING.NEUTRAL_SCORE;
  if (!userBrandPreferences || !brand) return neutralScore;

  const preference = userBrandPreferences.get
    ? userBrandPreferences.get(brand)
    : userBrandPreferences[brand];
  if (!preference) return neutralScore;

  // Normalize preference (assuming 0-1 range)
  return Math.round(preference * recommendationConfig.SCORING.MAX_SCORE);
}

/**
 * Calculate final recommendation score
 * @param {Object} scores - Individual scores
 * @param {Object} weights - Weights for each score type
 * @returns {Number} Final score
 */
function calculateFinalScore(scores, weights = {}) {
  const defaultWeights = recommendationConfig.COMPATIBILITY.SCORING_WEIGHTS;
  // Convert percentage weights to decimal
  const normalizedDefaultWeights = {
    compatibility: defaultWeights.compatibility / 100,
    price: defaultWeights.price / 100,
    brand: defaultWeights.brand / 100,
    popularity: defaultWeights.popularity / 100,
  };

  const finalWeights = { ...normalizedDefaultWeights, ...weights };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [scoreType, weight] of Object.entries(finalWeights)) {
    if (scores[scoreType] !== undefined) {
      totalScore += scores[scoreType] * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

module.exports = {
  INTERACTION_WEIGHTS,
  calculateFavoriteScore,
  calculateCompatibilityScore,
  calculatePriceScore,
  calculateBrandScore,
  calculateFinalScore,
};
