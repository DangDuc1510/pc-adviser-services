const createBaseRepository = require('./base.repository');
const ChatKnowledgeBase = require('../models/chatKnowledgeBase.model');
const { DatabaseError } = require('../errors');

const baseRepo = createBaseRepository(ChatKnowledgeBase);

// Search knowledge base by text
const searchByText = async (searchTerm, options = {}) => {
  try {
    const { limit = 10, category } = options;
    const filter = {
      $text: { $search: searchTerm },
      status: 'active'
    };
    
    if (category) {
      filter.category = category;
    }
    
    return await ChatKnowledgeBase.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .exec();
  } catch (error) {
    throw new DatabaseError(`Error searching knowledge base: ${error.message}`);
  }
};

// Find by category
const findByCategory = async (category, options = {}) => {
  try {
    return await baseRepo.find({ category, status: 'active' }, options);
  } catch (error) {
    throw new DatabaseError(`Error finding knowledge by category: ${error.message}`);
  }
};

// Find by tags
const findByTags = async (tags, options = {}) => {
  try {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    return await baseRepo.find({ tags: { $in: tagArray }, status: 'active' }, options);
  } catch (error) {
    throw new DatabaseError(`Error finding knowledge by tags: ${error.message}`);
  }
};

// Update usage statistics
const incrementAccessCount = async (id) => {
  try {
    const knowledge = await ChatKnowledgeBase.findByIdAndUpdate(
      id,
      {
        $inc: { 'usage.accessCount': 1 },
        $set: { 'usage.lastAccessed': new Date() }
      },
      { new: true }
    );
    return knowledge;
  } catch (error) {
    throw new DatabaseError(`Error incrementing access count: ${error.message}`);
  }
};

// Update effectiveness
const updateEffectiveness = async (id, effectiveness) => {
  try {
    const knowledge = await ChatKnowledgeBase.findByIdAndUpdate(
      id,
      { $set: { 'usage.effectiveness': effectiveness } },
      { new: true }
    );
    return knowledge;
  } catch (error) {
    throw new DatabaseError(`Error updating effectiveness: ${error.message}`);
  }
};

// Get knowledge with pagination
const getWithPagination = async (filter = {}, page = 1, limit = 20, options = {}) => {
  try {
    const skip = (page - 1) * limit;
    const { sort = { createdAt: -1 } } = options;
    
    const [knowledge, total] = await Promise.all([
      baseRepo.find(filter, { sort, skip, limit }),
      baseRepo.count(filter)
    ]);
    
    return {
      knowledge,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new DatabaseError(`Error getting knowledge with pagination: ${error.message}`);
  }
};

// Find by embedding similarity (for vector search - placeholder)
const findByEmbedding = async (embedding, limit = 10, threshold = 0.7) => {
  try {
    // This is a placeholder - actual implementation would use vector similarity search
    // For now, return empty array. Can be implemented with MongoDB Atlas Vector Search
    // or external vector database like Pinecone, Weaviate, etc.
    return [];
  } catch (error) {
    throw new DatabaseError(`Error finding by embedding: ${error.message}`);
  }
};

module.exports = {
  ...baseRepo,
  searchByText,
  findByCategory,
  findByTags,
  incrementAccessCount,
  updateEffectiveness,
  getWithPagination,
  findByEmbedding
};

