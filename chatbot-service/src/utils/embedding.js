const { getOpenAIClient } = require('../config/openai');

/**
 * Generate embedding vector for text using OpenAI embeddings API
 * @param {string} text - Text to generate embedding for
 * @param {string} model - Embedding model (default: text-embedding-ada-002)
 * @returns {Promise<number[]>} Embedding vector
 */
const generateEmbedding = async (text, model = 'text-embedding-ada-002') => {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model,
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

/**
 * Generate embeddings for multiple texts
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @param {string} model - Embedding model
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
const generateEmbeddings = async (texts, model = 'text-embedding-ada-002') => {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model,
      input: texts
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score (0-1)
 */
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity
};

