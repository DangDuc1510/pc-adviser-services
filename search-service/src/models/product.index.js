// Elasticsearch index mapping for products with Vietnamese language support

const productIndexMapping = {
  mappings: {
    properties: {
      id: {
        type: 'keyword',
      },
      name: {
        type: 'text',
        analyzer: 'vietnamese_analyzer',
        fields: {
          keyword: {
            type: 'keyword',
          },
          suggest: {
            type: 'completion',
          },
        },
      },
      brand: {
        type: 'text',
        analyzer: 'vietnamese_analyzer',
        fields: {
          keyword: {
            type: 'keyword',
          },
        },
      },
      category: {
        type: 'keyword',
      },
      categoryId: {
        type: 'keyword',
      },
      type: {
        type: 'keyword',
      },
      description: {
        type: 'text',
        analyzer: 'vietnamese_analyzer',
      },
      price: {
        type: 'float',
      },
      originalPrice: {
        type: 'float',
      },
      currency: {
        type: 'keyword',
      },
      specs: {
        type: 'text',
        analyzer: 'vietnamese_analyzer',
        fields: {
          keyword: {
            type: 'keyword',
          },
        },
      },
      specifications: {
        type: 'object',
        enabled: true,
        properties: {
          // Dynamic mapping will handle nested fields
        },
      },
      suggest: {
        type: 'completion',
        preserve_separators: true,
        preserve_position_increments: true,
        max_input_length: 50,
      },
      status: {
        type: 'keyword',
      },
      inventory: {
        type: 'object',
        properties: {
          available: {
            type: 'integer',
          },
          inStock: {
            type: 'boolean',
          },
        },
      },
      popularity: {
        type: 'float',
      },
      rating: {
        type: 'float',
      },
      reviewCount: {
        type: 'integer',
      },
      images: {
        type: 'text',
      },
      image: {
        type: 'keyword',
      },
      tags: {
        type: 'keyword',
      },
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
    },
  },
      settings: {
    analysis: {
      analyzer: {
        vietnamese_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'lowercase',
            'asciifolding',
            'vietnamese_stop',
          ],
        },
        vietnamese_search: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'lowercase',
            'asciifolding',
            'vietnamese_stop',
          ],
        },
      },
      filter: {
        vietnamese_stop: {
          type: 'stop',
          stopwords: [
            'và', 'của', 'cho', 'với', 'từ', 'trong', 'trên', 'dưới',
            'về', 'theo', 'khi', 'nếu', 'nhưng', 'hoặc', 'được', 'bị',
            'là', 'có', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy',
            'tám', 'chín', 'mười', 'này', 'đó', 'kia', 'nào', 'đâu',
          ],
        },
      },
    },
    number_of_shards: 1,
    number_of_replicas: 0, // Can be increased for production
  },
};

module.exports = productIndexMapping;

