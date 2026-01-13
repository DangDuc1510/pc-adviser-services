/**
 * Calculate Jaccard similarity between two sets
 * @param {Set|Array} setA - First set
 * @param {Set|Array} setB - Second set
 * @returns {Number} Similarity score (0-1)
 */
function jaccardSimilarity(setA, setB) {
  const a = new Set(setA);
  const b = new Set(setB);
  
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}

/**
 * Calculate Cosine similarity between two vectors
 * @param {Object|Map} vectorA - First vector (product -> weight)
 * @param {Object|Map} vectorB - Second vector (product -> weight)
 * @returns {Number} Similarity score (0-1)
 */
function cosineSimilarity(vectorA, vectorB) {
  const a = vectorA instanceof Map ? vectorA : new Map(Object.entries(vectorA));
  const b = vectorB instanceof Map ? vectorB : new Map(Object.entries(vectorB));
  
  const allProducts = new Set([...a.keys(), ...b.keys()]);
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (const productId of allProducts) {
    const weightA = a.get(productId) || 0;
    const weightB = b.get(productId) || 0;
    
    dotProduct += weightA * weightB;
    normA += weightA * weightA;
    normB += weightB * weightB;
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

/**
 * Calculate product similarity based on features
 * @param {Object} productA - First product features
 * @param {Object} productB - Second product features
 * @param {Object} weights - Feature weights
 * @returns {Number} Similarity score (0-100)
 */
function calculateProductSimilarity(productA, productB, weights = {}) {
  const defaultWeights = {
    brand: 20,
    price: 30,
    specifications: 30,
    colors: 10,
    useCases: 10
  };
  
  const finalWeights = { ...defaultWeights, ...weights };
  let totalScore = 0;
  let totalWeight = 0;
  
  // Brand match
  if (productA.brand && productB.brand) {
    const match = productA.brand === productB.brand ? 1 : 0;
    totalScore += match * finalWeights.brand;
    totalWeight += finalWeights.brand;
  }
  
  // Price similarity
  if (productA.price && productB.price) {
    const priceDiff = Math.abs(productA.price - productB.price);
    const avgPrice = (productA.price + productB.price) / 2;
    const similarity = avgPrice > 0 ? Math.max(0, 1 - priceDiff / avgPrice) : 0;
    totalScore += similarity * finalWeights.price;
    totalWeight += finalWeights.price;
  }
  
  // Specification similarity
  if (productA.specifications && productB.specifications) {
    const specA = productA.specifications;
    const specB = productB.specifications;
    
    let specMatches = 0;
    let specTotal = 0;
    
    // Compare common specification fields
    const specFields = ['socket', 'chipset', 'memory', 'formFactor'];
    for (const field of specFields) {
      if (specA[field] || specB[field]) {
        specTotal++;
        if (specA[field] === specB[field]) {
          specMatches++;
        }
      }
    }
    
    const specSimilarity = specTotal > 0 ? specMatches / specTotal : 0;
    totalScore += specSimilarity * finalWeights.specifications;
    totalWeight += finalWeights.specifications;
  }
  
  // Color match
  if (productA.colors && productB.colors && productA.colors.length > 0 && productB.colors.length > 0) {
    const colorsA = new Set(productA.colors);
    const colorsB = new Set(productB.colors);
    const intersection = new Set([...colorsA].filter(x => colorsB.has(x)));
    const union = new Set([...colorsA, ...colorsB]);
    const colorSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    totalScore += colorSimilarity * finalWeights.colors;
    totalWeight += finalWeights.colors;
  }
  
  // Use case match
  if (productA.useCases && productB.useCases && productA.useCases.length > 0 && productB.useCases.length > 0) {
    const useCasesA = new Set(productA.useCases);
    const useCasesB = new Set(productB.useCases);
    const intersection = new Set([...useCasesA].filter(x => useCasesB.has(x)));
    const union = new Set([...useCasesA, ...useCasesB]);
    const useCaseSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    totalScore += useCaseSimilarity * finalWeights.useCases;
    totalWeight += finalWeights.useCases;
  }
  
  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
}

module.exports = {
  jaccardSimilarity,
  cosineSimilarity,
  calculateProductSimilarity
};

