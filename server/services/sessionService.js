const CHAT_HISTORY_PREFIX = "chat:";
const SESSION_PREFIX = "session:";
const DEFAULT_TTL = 3600; // 1 hour

export async function createSession(redis, sessionId) {
  const sessionKey = `${SESSION_PREFIX}${sessionId}`;
  await redis.setex(
    sessionKey,
    DEFAULT_TTL,
    JSON.stringify({
      id: sessionId,
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    })
  );
}

export async function getChatHistory(redis, sessionId) {
  const historyKey = `${CHAT_HISTORY_PREFIX}${sessionId}`;
  // ioredis uses lowercase "lrange"
  const messages = await redis.lrange(historyKey, 0, -1);
  return messages.map((msg) => JSON.parse(msg));
}

export async function addMessageToHistory(redis, sessionId, message) {
  const historyKey = `${CHAT_HISTORY_PREFIX}${sessionId}`;
  const sessionKey = `${SESSION_PREFIX}${sessionId}`;

  // Add message to history
  await redis.rpush(historyKey, JSON.stringify(message));

  // Update session activity
  await redis.setex(
    sessionKey,
    DEFAULT_TTL,
    JSON.stringify({
      id: sessionId,
      lastActivity: new Date().toISOString(),
    })
  );

  // Set TTL for chat history
  await redis.expire(historyKey, DEFAULT_TTL);
}

export async function clearChatHistory(redis, sessionId) {
  const historyKey = `${CHAT_HISTORY_PREFIX}${sessionId}`;
  await redis.del(historyKey);
}
