const buildSystemPrompt = (context = {}) => {
  const { purpose = 'general', userProfile = {}, buildId = null } = context;
  
  let systemPrompt = `You are a helpful AI assistant for a PC building platform. Your role is to help users:
1. Understand PC components and their compatibility
2. Build PC configurations based on their needs and budget
3. Answer technical questions about PC hardware
4. Provide product recommendations
5. Troubleshoot PC-related issues

Guidelines:
- Be friendly, professional, and helpful
- Provide accurate technical information
- Ask clarifying questions when needed (budget, use case, preferences)
- Suggest compatible components
- Consider price-to-performance ratios
- Keep responses concise but informative`;

  if (purpose === 'build_help') {
    systemPrompt += `\n\nCurrent Context: User is building a PC. Focus on component selection, compatibility, and recommendations.`;
    if (buildId) {
      systemPrompt += `\nBuild ID: ${buildId} - reference this build when relevant.`;
    }
  } else if (purpose === 'product_inquiry') {
    systemPrompt += `\n\nCurrent Context: User is inquiring about specific products. Provide detailed information about product specifications, compatibility, and comparisons.`;
  } else if (purpose === 'support') {
    systemPrompt += `\n\nCurrent Context: User needs support. Be empathetic and help solve their issue step by step.`;
  }

  if (userProfile.experience) {
    systemPrompt += `\n\nUser Experience Level: ${userProfile.experience}`;
    if (userProfile.experience === 'beginner') {
      systemPrompt += ` - Use simpler language and explain technical terms.`;
    } else if (userProfile.experience === 'expert') {
      systemPrompt += ` - You can use technical terminology and detailed specifications.`;
    }
  }

  if (userProfile.preferences) {
    systemPrompt += `\n\nUser Preferences: ${JSON.stringify(userProfile.preferences)}`;
  }

  systemPrompt += `\n\nRemember: Always prioritize compatibility and value for money. If you don't know something, admit it rather than guessing.`;

  return systemPrompt;
};

const buildConversationMessages = (systemPrompt, conversationHistory, currentMessage, knowledgeContext = null) => {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add knowledge context if available
  if (knowledgeContext && knowledgeContext.length > 0) {
    const knowledgeText = knowledgeContext
      .map(kb => `[Knowledge Base]\n${kb.title}\n${kb.content}`)
      .join('\n\n---\n\n');
    messages.push({
      role: 'system',
      content: `Relevant Knowledge Base Information:\n\n${knowledgeText}\n\nUse this information to provide accurate answers.`
    });
  }

  // Add conversation history (limit to last 10 messages to avoid token limits)
  const recentHistory = conversationHistory.slice(-10);
  recentHistory.forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage
  });

  return messages;
};

const extractEntities = (text) => {
  // Basic entity extraction patterns
  const entities = {
    budget: null,
    purpose: [],
    componentTypes: [],
    brands: []
  };

  // Extract budget (numbers with currency indicators)
  const budgetMatch = text.match(/(\d+)\s*(?:triệu|million|vnd|vnđ|đ|usd|\$)/i);
  if (budgetMatch) {
    entities.budget = {
      amount: parseInt(budgetMatch[1]),
      currency: budgetMatch[0].toLowerCase().includes('usd') || budgetMatch[0].includes('$') ? 'USD' : 'VND'
    };
  }

  // Extract purpose keywords
  const purposeKeywords = {
    gaming: ['gaming', 'chơi game', 'game'],
    office: ['office', 'văn phòng', 'work', 'làm việc'],
    design: ['design', 'thiết kế', 'graphic', 'editing', 'render'],
    streaming: ['streaming', 'phát trực tiếp', 'stream']
  };

  for (const [purpose, keywords] of Object.entries(purposeKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      entities.purpose.push(purpose);
    }
  }

  // Extract component types
  const componentTypes = ['cpu', 'gpu', 'ram', 'mainboard', 'storage', 'psu', 'case', 'cooler'];
  componentTypes.forEach(type => {
    if (text.toLowerCase().includes(type)) {
      entities.componentTypes.push(type);
    }
  });

  // Extract brands (common PC brands)
  const brands = ['intel', 'amd', 'nvidia', 'asus', 'msi', 'gigabyte', 'corsair', 'kingston', 'samsung', 'western digital'];
  brands.forEach(brand => {
    if (text.toLowerCase().includes(brand)) {
      entities.brands.push(brand);
    }
  });

  return entities;
};

module.exports = {
  buildSystemPrompt,
  buildConversationMessages,
  extractEntities
};

