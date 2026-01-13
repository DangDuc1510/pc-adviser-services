const sessionService = require('./session.service');
const llmService = require('./llm.service');
const intentService = require('./intent.service');
const knowledgeService = require('./knowledge.service');
const { chatSessionRepository } = require('../repositories');
const { buildSystemPrompt, buildConversationMessages, extractEntities } = require('../utils/promptBuilder');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');
const config = require('../config/env');

class ChatService {
  /**
   * Create a new chat session
   */
  async createSession(userId = null) {
    try {
      const sessionId = sessionService.generateSessionId();
      
      const sessionData = {
        sessionId,
        userId,
        createdAt: new Date(),
        context: {
          purpose: 'general',
          userProfile: {
            experience: 'beginner',
            preferences: {}
          }
        },
        state: {
          currentTopic: null,
          gatheringInfo: {},
          pendingActions: [],
          lastIntent: null
        }
      };

      // Save to Redis
      await sessionService.saveSession(sessionId, sessionData);

      // Save to MongoDB
      const session = await chatSessionRepository.create({
        sessionId,
        userId,
        context: sessionData.context,
        state: sessionData.state,
        status: 'active',
        messages: []
      });

      logger.info('Chat session created', { sessionId, userId });

      return session;
    } catch (error) {
      logger.error('Error creating chat session:', error);
      throw error;
    }
  }

  /**
   * Process user message and generate response
   */
  async processMessage(sessionId, message, userId = null) {
    const startTime = Date.now();

    try {
      // Get or create session
      let session = await chatSessionRepository.findBySessionId(sessionId);
      
      if (!session) {
        // Create new session if doesn't exist
        session = await this.createSession(userId);
      }

      // Refresh Redis session
      await sessionService.refreshSession(sessionId);

      // Get session context from Redis or MongoDB
      let context = await sessionService.getContext(sessionId);
      if (!context) {
        context = session.context || {
          purpose: 'general',
          userProfile: {
            experience: 'beginner',
            preferences: {}
          }
        };
        await sessionService.saveContext(sessionId, context);
      }

      // Extract intent and entities
      const intentResult = await intentService.detectIntent(message, context);
      const entities = extractEntities(message);

      // Update context if new information detected
      if (entities.budget) {
        context.userProfile.preferences = {
          ...context.userProfile.preferences,
          budget: entities.budget
        };
      }
      if (entities.purpose.length > 0) {
        context.purpose = entities.purpose[0];
      }

      // Retrieve relevant knowledge base entries
      const knowledgeContext = await knowledgeService.retrieveRelevantKnowledge(
        message,
        intentResult.intent,
        entities
      );

      // Build conversation messages
      const systemPrompt = buildSystemPrompt(context);
      const conversationHistory = session.messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const messages = buildConversationMessages(
        systemPrompt,
        conversationHistory,
        message,
        knowledgeContext
      );

      // Generate AI response
      const aiResponse = await llmService.generateCompletion(messages);

      // Update session state
      const newState = {
        ...session.state,
        currentTopic: intentResult.intent,
        lastIntent: intentResult.intent
      };
      await chatSessionRepository.updateState(sessionId, newState);
      await sessionService.saveContext(sessionId, context);

      // Save messages to database
      const userMessage = {
        role: 'user',
        content: message,
        metadata: {
          intent: intentResult.intent,
          entities,
          confidence: intentResult.confidence
        },
        timestamp: new Date()
      };

      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.content,
        metadata: {
          intent: intentResult.intent,
          sources: knowledgeContext.map(kb => kb.title),
          tokens: aiResponse.tokens,
          model: aiResponse.model,
          responseTime: aiResponse.responseTime
        },
        timestamp: new Date()
      };

      await chatSessionRepository.addMessage(sessionId, userMessage);
      await chatSessionRepository.addMessage(sessionId, assistantMessage);

      // Also save to Redis for quick access
      await sessionService.addMessageToHistory(sessionId, userMessage);
      await sessionService.addMessageToHistory(sessionId, assistantMessage);

      logger.info('Message processed', {
        sessionId,
        intent: intentResult.intent,
        responseTime: Date.now() - startTime,
        tokens: aiResponse.tokens.total
      });

      return {
        reply: aiResponse.content,
        sessionId,
        intent: intentResult.intent,
        entities,
        metadata: {
          tokens: aiResponse.tokens,
          responseTime: aiResponse.responseTime,
          model: aiResponse.model
        }
      };
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Get chat history
   */
  async getHistory(sessionId, page = 1, limit = 50) {
    try {
      return await chatSessionRepository.getHistory(sessionId, page, limit);
    } catch (error) {
      logger.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * End chat session
   */
  async endSession(sessionId) {
    try {
      await chatSessionRepository.endSession(sessionId);
      await sessionService.deleteSession(sessionId);
      
      logger.info('Chat session ended', { sessionId });
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for a session
   */
  async submitFeedback(sessionId, feedback) {
    try {
      await chatSessionRepository.updateFeedback(sessionId, feedback);
      logger.info('Feedback submitted', { sessionId, feedback });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get sessions for a user
   */
  async getUserSessions(userId, page = 1, limit = 20) {
    try {
      return await chatSessionRepository.getSessionsByUser(userId, page, limit);
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();

