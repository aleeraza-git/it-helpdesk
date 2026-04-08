// lib/socket-server.ts - WebSocket event types and helpers
export const SOCKET_EVENTS = {
  // Chat events
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  CHAT_STATUS_CHANGED: 'chat_status_changed',
  CHAT_ASSIGNED: 'chat_assigned',
  
  // Agent events
  AGENT_STATUS_CHANGED: 'agent_status_changed',
  QUEUE_UPDATED: 'queue_updated',
  
  // Notification events
  NEW_NOTIFICATION: 'new_notification',
  
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  
  // Presence
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
}

export const ROOMS = {
  chat: (chatId: string) => `chat:${chatId}`,
  user: (userId: string) => `user:${userId}`,
  agents: 'agents',
  managers: 'managers',
  queue: 'queue',
}
