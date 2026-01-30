const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const { validateUserIdentifier, validateProductId, validateComponentType } = require('../middlewares/validator');

// Compatible recommendations
router.get('/compatible', validateComponentType, recommendationController.getCompatibleRecommendations);

// Favorite products
router.get('/favorites', validateUserIdentifier, recommendationController.getFavoriteProducts);

// Similar products
router.get('/similar', validateProductId, recommendationController.getSimilarProducts);

// Personalized recommendations
router.get('/personalized', validateUserIdentifier, recommendationController.getPersonalizedRecommendations);

// Build suggestions for missing components
router.post('/build-suggestions', recommendationController.getBuildSuggestions);

// Clear cache
router.post('/clear-cache', recommendationController.clearCache);

module.exports = router;

