/**
 * IMARAT IT Support - WebSocket Real-time Server
 * Handles: chat messages, presence, typing indicators, notifications
 */

const WebSocket = require('ws');
const { verifyToken } = require('./auth');

// Map: userId -> Set of WebSocket connections (user can have multiple tabs)
const userConnections = new Map();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId = null;

    // Authenticate on first message
    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      // AUTH message must be first
      if (!userId) {
        if (msg.type !== 'auth') { ws.close(4001, 'Auth required'); return; }
        try {
          const payload = verifyToken(msg.token);
          userId = payload.id;
          if (!userConnections.has(userId)) userConnections.set(userId, new Set());
          userConnections.get(userId).add(ws);
          ws.userId = userId;
          ws.send(JSON.stringify({ type: 'auth_ok', userId }));
          console.log(`WS: User ${userId} connected`);
        } catch {
          ws.close(4002, 'Invalid token');
        }
        return;
      }

      // Route authenticated messages
      switch (msg.type) {
        case 'typing':
          // Broadcast typing indicator to chat participants
          broadcastToChatParticipants(msg.chatId, userId, {
            type: 'typing',
            chatId: msg.chatId,
            userId,
            isTyping: msg.isTyping,
          });
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'mark_read':
          // Broadcast read receipt to chat participants
          broadcastToChatParticipants(msg.chatId, userId, {
            type: 'read_receipt',
            chatId: msg.chatId,
            userId,
          });
          break;
      }
    });

    ws.on('close', () => {
      if (userId && userConnections.has(userId)) {
        userConnections.get(userId).delete(ws);
        if (userConnections.get(userId).size === 0) {
          userConnections.delete(userId);
          console.log(`WS: User ${userId} disconnected`);
        }
      }
    });

    ws.on('error', (err) => {
      console.error('WS error:', err.message);
    });
  });

  return wss;
}

/**
 * Send a message to all WebSocket connections for a specific user
 */
function sendToUser(userId, payload) {
  const conns = userConnections.get(userId);
  if (!conns) return;
  const data = JSON.stringify(payload);
  for (const ws of conns) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

/**
 * Broadcast a chat event to both the user and the agent in a chat
 * Exclude the sender (they already have it from the HTTP response)
 */
function broadcastToChat(chat, excludeUserId, payload) {
  const recipients = new Set();
  if (chat.user_id && chat.user_id !== excludeUserId) recipients.add(chat.user_id);
  if (chat.agent_id && chat.agent_id !== excludeUserId) recipients.add(chat.agent_id);
  // Always send to manager connections
  for (const [uid, conns] of userConnections) {
    for (const ws of conns) {
      if (ws.userRole === 'manager' && uid !== excludeUserId) recipients.add(uid);
    }
  }
  for (const uid of recipients) {
    sendToUser(uid, payload);
  }
}

function broadcastToChatParticipants(chatId, excludeUserId, payload) {
  // Broadcast to all connected users except sender
  for (const [uid] of userConnections) {
    if (uid !== excludeUserId) sendToUser(uid, payload);
  }
}

/**
 * Broadcast a system-wide event to all managers
 */
function broadcastToManagers(payload) {
  for (const [uid, conns] of userConnections) {
    for (const ws of conns) {
      if (ws.readyState === WebSocket.OPEN) sendToUser(uid, payload);
    }
  }
}

/**
 * Check if a user is currently online (has WS connection)
 */
function isUserOnline(userId) {
  return userConnections.has(userId) && userConnections.get(userId).size > 0;
}

module.exports = { setupWebSocket, sendToUser, broadcastToChat, broadcastToManagers, isUserOnline };
