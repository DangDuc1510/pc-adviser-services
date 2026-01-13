const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge.controller');
const { optionalAuth, requireAuth } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', knowledgeController.getKnowledge);
router.get('/:id', knowledgeController.getKnowledgeById);

// Admin routes (require authentication)
router.post('/', requireAuth, knowledgeController.createKnowledge);
router.put('/:id', requireAuth, knowledgeController.updateKnowledge);
router.delete('/:id', requireAuth, knowledgeController.deleteKnowledge);

module.exports = router;

