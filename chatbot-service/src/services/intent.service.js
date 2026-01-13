const logger = require('../utils/logger');

// Intent detection patterns and keywords
const INTENT_PATTERNS = {
  build_help: [
    'build', 'tư vấn', 'cấu hình', 'chọn', 'lắp ráp', 'pc', 'computer',
    'cpu', 'gpu', 'ram', 'mainboard', 'psu', 'power supply',
    'case', 'cooler', 'storage', 'ssd', 'hdd'
  ],
  product_inquiry: [
    'sản phẩm', 'product', 'thông tin', 'specs', 'thông số',
    'so sánh', 'compare', 'giá', 'price', 'review', 'đánh giá'
  ],
  support: [
    'help', 'giúp', 'hỗ trợ', 'vấn đề', 'problem', 'lỗi', 'error',
    'không hoạt động', 'không work', 'troubleshoot', 'sửa'
  ],
  general: [
    'xin chào', 'hello', 'hi', 'chào', 'hỏi', 'question', 'câu hỏi'
  ]
};

/**
 * Detect intent from user message
 */
const detectIntent = async (message, context = {}) => {
  const lowerMessage = message.toLowerCase();
  const intentScores = {};

  // Calculate scores for each intent
  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        score += 1;
      }
    });
    intentScores[intent] = score;
  }

  // Determine primary intent
  let primaryIntent = 'general';
  let maxScore = 0;

  for (const [intent, score] of Object.entries(intentScores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryIntent = intent;
    }
  }

  // Use context to adjust intent
  if (context.purpose && context.purpose !== 'general') {
    if (intentScores[context.purpose] > 0) {
      primaryIntent = context.purpose;
    }
  }

  // Calculate confidence (simple heuristic)
  const totalScore = Object.values(intentScores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1) : 0.5;

  logger.debug('Intent detected', {
    message: message.substring(0, 50),
    intent: primaryIntent,
    confidence,
    scores: intentScores
  });

  return {
    intent: primaryIntent,
    confidence,
    scores: intentScores
  };
};

/**
 * Extract entities from message (enhanced version)
 */
const extractEntities = (message) => {
  const entities = {
    budget: null,
    purpose: [],
    componentTypes: [],
    brands: [],
    quantities: {}
  };

  const lowerMessage = message.toLowerCase();

  // Extract budget patterns
  const budgetPatterns = [
    /(\d+)\s*(?:triệu|million|m)\s*(?:vnđ|vnd|đ)/i,
    /(\d+)\s*(?:nghìn|thousand|k)\s*(?:vnđ|vnd|đ)/i,
    /\$\s*(\d+(?:\.\d+)?)\s*(?:million|m)?/i,
    /(\d+(?:\.\d+)?)\s*usd/i
  ];

  for (const pattern of budgetPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      let amount = parseFloat(match[1]);
      if (lowerMessage.includes('triệu') || lowerMessage.includes('million')) {
        amount = amount * 1000000;
      } else if (lowerMessage.includes('nghìn') || lowerMessage.includes('thousand')) {
        amount = amount * 1000;
      }
      
      entities.budget = {
        amount,
        currency: lowerMessage.includes('usd') || lowerMessage.includes('$') ? 'USD' : 'VND'
      };
      break;
    }
  }

  // Extract purpose
  const purposeMap = {
    gaming: ['gaming', 'chơi game', 'game'],
    office: ['office', 'văn phòng', 'work', 'làm việc', 'word', 'excel'],
    design: ['design', 'thiết kế', 'graphic', 'photoshop', 'illustrator', 'editing'],
    streaming: ['streaming', 'phát trực tiếp', 'stream', 'youtube'],
    rendering: ['render', '3d', 'video editing']
  };

  for (const [purpose, keywords] of Object.entries(purposeMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      entities.purpose.push(purpose);
    }
  }

  // Extract component types
  const componentMap = {
    cpu: ['cpu', 'processor', 'chip'],
    gpu: ['gpu', 'graphics card', 'video card', 'vga', 'card đồ họa'],
    ram: ['ram', 'memory', 'bộ nhớ'],
    mainboard: ['mainboard', 'bo mạch chủ', 'main'],
    storage: ['ssd', 'hdd', 'storage', 'hard drive', 'ổ cứng'],
    psu: ['psu', 'power supply', 'nguồn', 'bộ nguồn'],
    case: ['case', 'thùng máy', 'chassis'],
    cooler: ['cooler', 'fan', 'tản nhiệt', 'cooling']
  };

  for (const [type, keywords] of Object.entries(componentMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      entities.componentTypes.push(type);
    }
  }

  // Extract brands
  const brands = [
    'intel', 'amd', 'nvidia', 'asus', 'msi', 'gigabyte', 'asus rog',
    'corsair', 'kingston', 'samsung', 'western digital', 'seagate',
    'evga', 'zotac', 'galax', 'colorful'
  ];

  brands.forEach(brand => {
    if (lowerMessage.includes(brand)) {
      entities.brands.push(brand);
    }
  });

  return entities;
};

module.exports = {
  detectIntent,
  extractEntities
};

