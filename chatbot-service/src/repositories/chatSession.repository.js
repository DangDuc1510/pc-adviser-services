const createBaseRepository = require('./base.repository');
const ChatSession = require('../models/chatSession.model');
const { DatabaseError } = require('../errors');

const baseRepo = createBaseRepository(ChatSession);

// Find session by sessionId
const findBySessionId = async (sessionId, options = {}) => {
  try {
    return await baseRepo.findOne({ sessionId }, options);
  } catch (error) {
    throw new DatabaseError(`Error finding session by sessionId: ${error.message}`);
  }
};

// Find active sessions by userId
const findActiveSessionsByUserId = async (userId, options = {}) => {
  try {
    return await baseRepo.find({ userId, status: 'active' }, options);
  } catch (error) {
    throw new DatabaseError(`Error finding active sessions: ${error.message}`);
  }
};

// Add message to session
const addMessage = async (sessionId, message) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      { $push: { messages: message } },
      { new: true }
    );
    return session;
  } catch (error) {
    throw new DatabaseError(`Error adding message to session: ${error.message}`);
  }
};

// Update session state
const updateState = async (sessionId, stateUpdate) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      { $set: { state: stateUpdate } },
      { new: true }
    );
    return session;
  } catch (error) {
    throw new DatabaseError(`Error updating session state: ${error.message}`);
  }
};

// Update session context
const updateContext = async (sessionId, contextUpdate) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      { $set: { context: contextUpdate } },
      { new: true }
    );
    return session;
  } catch (error) {
    throw new DatabaseError(`Error updating session context: ${error.message}`);
  }
};

// Update session feedback
const updateFeedback = async (sessionId, feedback) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      { $set: { feedback } },
      { new: true }
    );
    return session;
  } catch (error) {
    throw new DatabaseError(`Error updating session feedback: ${error.message}`);
  }
};

// End session
const endSession = async (sessionId) => {
  try {
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return null;
    }
    
    const duration = Math.floor((Date.now() - session.createdAt) / 1000);
    const updatedSession = await ChatSession.findOneAndUpdate(
      { sessionId },
      { 
        $set: { 
          status: 'ended',
          endedAt: new Date(),
          duration
        }
      },
      { new: true }
    );
    return updatedSession;
  } catch (error) {
    throw new DatabaseError(`Error ending session: ${error.message}`);
  }
};

// Get session history with pagination
const getHistory = async (sessionId, page = 1, limit = 50) => {
  try {
    const session = await baseRepo.findOne({ sessionId });
    if (!session) {
      return { messages: [], pagination: { current: page, total: 0, pages: 0 } };
    }
    
    const messages = session.messages || [];
    const total = messages.length;
    const skip = (page - 1) * limit;
    const paginatedMessages = messages.slice(skip, skip + limit);
    
    return {
      messages: paginatedMessages,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new DatabaseError(`Error getting session history: ${error.message}`);
  }
};

// Get sessions by user with pagination
const getSessionsByUser = async (userId, page = 1, limit = 20, options = {}) => {
  try {
    const skip = (page - 1) * limit;
    const { sort = { createdAt: -1 } } = options;
    
    const [sessions, total] = await Promise.all([
      baseRepo.find({ userId }, { sort, skip, limit }),
      baseRepo.count({ userId })
    ]);
    
    return {
      sessions,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new DatabaseError(`Error getting user sessions: ${error.message}`);
  }
};

module.exports = {
  ...baseRepo,
  findBySessionId,
  findActiveSessionsByUserId,
  addMessage,
  updateState,
  updateContext,
  updateFeedback,
  endSession,
  getHistory,
  getSessionsByUser
};

