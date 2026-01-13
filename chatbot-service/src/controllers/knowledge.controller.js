const { knowledgeBaseRepository } = require('../repositories');
const { ValidationError, NotFoundError } = require('../errors');
const logger = require('../utils/logger');
const knowledgeService = require('../services/knowledge.service');

/**
 * Get knowledge entries with pagination
 */
exports.getKnowledge = async (req, res, next) => {
  try {
    const { page, limit, category, tags, search } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);

    const filter = { status: 'active' };
    
    if (category) {
      filter.category = category;
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    let result;
    if (search) {
      result = await knowledgeService.searchKnowledge(search, {
        limit: limitNum,
        category: category || null
      });
      // Convert to pagination format
      const total = result.length;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedResults = result.slice(startIndex, startIndex + limitNum);
      
      result = {
        knowledge: paginatedResults,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };
    } else {
      result = await knowledgeBaseRepository.getWithPagination(
        filter,
        pageNum,
        limitNum
      );
    }

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Error getting knowledge:', error);
    next(error);
  }
};

/**
 * Get knowledge entry by ID
 */
exports.getKnowledgeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const knowledge = await knowledgeBaseRepository.findById(id);
    
    if (!knowledge) {
      throw new NotFoundError('Knowledge entry not found');
    }

    // Increment access count
    await knowledgeBaseRepository.incrementAccessCount(id);

    res.json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    logger.error('Error getting knowledge by ID:', error);
    next(error);
  }
};

/**
 * Create knowledge entry (Admin only)
 */
exports.createKnowledge = async (req, res, next) => {
  try {
    const data = req.body;
    
    const knowledge = await knowledgeBaseRepository.create({
      ...data,
      source: {
        ...data.source,
        author: req.user?.id || null
      }
    });

    res.status(201).json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    logger.error('Error creating knowledge:', error);
    next(error);
  }
};

/**
 * Update knowledge entry (Admin only)
 */
exports.updateKnowledge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const knowledge = await knowledgeBaseRepository.updateById(id, updateData);
    
    if (!knowledge) {
      throw new NotFoundError('Knowledge entry not found');
    }

    res.json({
      status: 'success',
      data: knowledge
    });
  } catch (error) {
    logger.error('Error updating knowledge:', error);
    next(error);
  }
};

/**
 * Delete knowledge entry (Admin only)
 */
exports.deleteKnowledge = async (req, res, next) => {
  try {
    const { id } = req.params;

    const knowledge = await knowledgeBaseRepository.deleteById(id);
    
    if (!knowledge) {
      throw new NotFoundError('Knowledge entry not found');
    }

    res.json({
      status: 'success',
      message: 'Knowledge entry deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting knowledge:', error);
    next(error);
  }
};

