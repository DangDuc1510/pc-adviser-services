const { getOpenAIClient, getDefaultConfig } = require('../config/openai');
const { ExternalServiceError } = require('../errors');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.client = null;
    this.defaultConfig = getDefaultConfig();
  }

  /**
   * Get OpenAI client instance
   */
  getClient() {
    if (!this.client) {
      this.client = getOpenAIClient();
    }
    return this.client;
  }

  /**
   * Generate chat completion
   */
  async generateCompletion(messages, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = this.getClient();
      const config = {
        ...this.defaultConfig,
        ...options,
        messages
      };

      logger.debug('Sending request to OpenAI', {
        model: config.model,
        messagesCount: messages.length,
        maxTokens: config.max_tokens
      });

      const response = await client.chat.completions.create(config);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const choice = response.choices[0];
      const usage = response.usage;

      logger.info('OpenAI response received', {
        model: response.model,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        },
        responseTime
      });

      return {
        content: choice.message.content,
        model: response.model,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        },
        finishReason: choice.finish_reason,
        responseTime
      };
    } catch (error) {
      const endTime = Date.now();
      logger.error('OpenAI API error', {
        error: error.message,
        responseTime: endTime - startTime
      });

      if (error.response) {
        throw new ExternalServiceError(
          `OpenAI API error: ${error.response.status} - ${error.response.statusText}`,
          502
        );
      }

      throw new ExternalServiceError(`OpenAI service error: ${error.message}`, 502);
    }
  }

  /**
   * Generate chat completion with retry logic
   */
  async generateCompletionWithRetry(messages, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateCompletion(messages, options);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`Retry attempt ${attempt} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async *streamCompletion(messages, options = {}) {
    try {
      const client = this.getClient();
      const config = {
        ...this.defaultConfig,
        ...options,
        messages,
        stream: true
      };

      const stream = await client.chat.completions.create(config);

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (choice?.delta?.content) {
          yield choice.delta.content;
        }
      }
    } catch (error) {
      logger.error('OpenAI streaming error', { error: error.message });
      throw new ExternalServiceError(`OpenAI streaming error: ${error.message}`, 502);
    }
  }
}

module.exports = new LLMService();

