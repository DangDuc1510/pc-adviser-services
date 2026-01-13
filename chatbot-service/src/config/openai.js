const { OpenAI } = require('openai');
const config = require('./env');

let openaiClient = null;

const getOpenAIClient = () => {
  if (!config.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }
  
  return openaiClient;
};

const getDefaultConfig = () => {
  return {
    model: config.OPENAI_MODEL,
    max_tokens: config.OPENAI_MAX_TOKENS,
    temperature: config.OPENAI_TEMPERATURE,
  };
};

module.exports = {
  getOpenAIClient,
  getDefaultConfig,
};

