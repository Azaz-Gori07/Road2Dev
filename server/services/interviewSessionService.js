import InterviewSession from '../models/InterviewSession.js';

export const createSession = async (userId, sessionData) => {
  const session = new InterviewSession({ userId, ...sessionData });
  return session.save();
};

export const getSessionById = async (sessionId, userId) => {
  return InterviewSession.findOne({ _id: sessionId, userId }).lean();
};

export const listSessionsForUser = async (userId, filters = {}) => {
  return InterviewSession.find({ userId, ...filters }).sort({ createdAt: -1 }).lean();
};

export const updateSession = async (sessionId, userId, updates) => {
  const updated = await InterviewSession.findOneAndUpdate(
    { _id: sessionId, userId },
    { ...updates, updatedAt: new Date() },
    { new: true }
  ).lean();

  return updated;
};

export const deleteSession = async (sessionId, userId) => {
  const result = await InterviewSession.deleteOne({ _id: sessionId, userId });
  return result.deletedCount > 0;
};
