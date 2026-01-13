const { knowledgeBaseRepository } = require('../repositories');
const { generateEmbedding, cosineSimilarity } = require('../utils/embedding');
const logger = require('../utils/logger');

class KnowledgeService {
  /**
   * Retrieve relevant knowledge base entries for a query
   */
  async retrieveRelevantKnowledge(query, intent = 'general', entities = {}, limit = 5) {
    try {
      let results = [];

      // Try text search first
      const textResults = await knowledgeBaseRepository.searchByText(query, {
        limit: limit * 2,
        category: this.mapIntentToCategory(intent)
      });

      // If we have embeddings, try semantic search
      // For now, we'll use text search and filter by relevance
      results = textResults.slice(0, limit);

      // Update access statistics
      for (const kb of results) {
        await knowledgeBaseRepository.incrementAccessCount(kb._id);
      }

      logger.debug('Knowledge retrieved', {
        query: query.substring(0, 50),
        intent,
        count: results.length
      });

      return results;
    } catch (error) {
      logger.error('Error retrieving knowledge:', error);
      // Return empty array on error to not break the flow
      return [];
    }
  }

  /**
   * Map intent to knowledge base category
   */
  mapIntentToCategory(intent) {
    const mapping = {
      build_help: 'build_guide',
      product_inquiry: 'product',
      support: 'troubleshooting',
      general: null // no filter
    };

    return mapping[intent] || null;
  }

  /**
   * Search knowledge base by text with semantic enhancement
   */
  async searchKnowledge(query, options = {}) {
    try {
      const { limit = 10, category = null, useEmbedding = false } = options;

      // Text-based search
      const textResults = await knowledgeBaseRepository.searchByText(query, {
        limit,
        category
      });

      // If embedding search is enabled and we have embeddings
      if (useEmbedding) {
        try {
          const queryEmbedding = await generateEmbedding(query);
          
          // Find knowledge entries with embeddings
          const allKnowledge = await knowledgeBaseRepository.find({
            status: 'active',
            embedding: { $exists: true, $ne: [] },
            ...(category && { category })
          });

          // Calculate similarities
          const withSimilarity = allKnowledge
            .map(kb => ({
              ...kb.toObject(),
              similarity: cosineSimilarity(queryEmbedding, kb.embedding)
            }))
            .filter(item => item.similarity > 0.7) // threshold
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

          // Merge with text results and deduplicate
          const combined = [...textResults, ...withSimilarity];
          const unique = new Map();
          
          combined.forEach(item => {
            const id = item._id.toString();
            if (!unique.has(id) || (unique.get(id).similarity || 0) < (item.similarity || 0)) {
              unique.set(id, item);
            }
          });

          return Array.from(unique.values()).slice(0, limit);
        } catch (embeddingError) {
          logger.warn('Embedding search failed, using text search only', embeddingError);
        }
      }

      return textResults;
    } catch (error) {
      logger.error('Error searching knowledge:', error);
      throw error;
    }
  }

  /**
   * Get knowledge by category
   */
  async getKnowledgeByCategory(category, options = {}) {
    try {
      return await knowledgeBaseRepository.findByCategory(category, options);
    } catch (error) {
      logger.error('Error getting knowledge by category:', error);
      throw error;
    }
  }

  /**
   * Get knowledge by tags
   */
  async getKnowledgeByTags(tags, options = {}) {
    try {
      return await knowledgeBaseRepository.findByTags(tags, options);
    } catch (error) {
      logger.error('Error getting knowledge by tags:', error);
      throw error;
    }
  }
}

module.exports = new KnowledgeService();

