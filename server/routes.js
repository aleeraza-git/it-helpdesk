/**
 * IMARAT IT Support - API Routes
 * All REST endpoints for the frontend
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db, helpers } = require('./database');
const { signToken, requireAuth, requireAgent, requireManager } = require('./auth');
const { sendToUser, broadcastToChat, broadcastToManagers } = require('./websocket');

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.log', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Helper: strip password from user object
function safeUser(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  safe.skills = tryParse(safe.skills, []);
  return safe;
}

function tryParse(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
}

function genId() { return uuidv4(); }

function notifyUser(userId, type, title, text, chatId = null, ticketId = null) {
  const id = genId();
  helpers.createNotification.run(id, userId, type, title, text, chatId, ticketId);
  sendToUser(userId, { type: 'notification', notification: { id, userId, type, title, text, chatId, ticketId, read: 0, created_at: new Date().toISOString() } });
}

function auditLog(userId, action, entityType, entityId, details = {}, ip = '') {
  helpers.createAuditLog.run(genId(), userId, action, entityType, entityId, JSON.stringify(details), ip);
}

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

// POST /api/auth/login
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = helpers.getUserByEmail.get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  helpers.updateUserStatus.run('online', user.id);
  auditLog(user.id, 'login', 'user', user.id, { email }, req.ip);

  const token = signToken(user);
  res.json({ token, user: safeUser({ ...user, status: 'online' }) });
});

// POST /api/auth/logout
router.post('/auth/logout', requireAuth, (req, res) => {
  helpers.updateUserStatus.run('offline', req.user.id);
  auditLog(req.user.id, 'logout', 'user', req.user.id, {}, req.ip);
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, (req, res) => {
  const user = helpers.getUserById.get(req.user.id);
  res.json({ user: safeUser(user) });
});

// PUT /api/auth/password
router.put('/auth/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const user = helpers.getUserById.get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password incorrect' });

  const hashed = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hashed, req.user.id);
  auditLog(req.user.id, 'password_change', 'user', req.user.id, {}, req.ip);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────────

// GET /api/users - All users (manager only)
router.get('/users', requireAuth, requireManager, (req, res) => {
  const users = helpers.getAllUsers.all().map(safeUser);
  res.json({ users });
});

// GET /api/users/agents - All agents
router.get('/users/agents', requireAuth, (req, res) => {
  const agents = helpers.getUsersByRole.all('agent').map(safeUser);
  res.json({ agents });
});

// GET /api/users/:id
router.get('/users/:id', requireAuth, (req, res) => {
  const user = helpers.getUserById.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Users can only view their own profile unless agent/manager
  if (req.user.role === 'user' && req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  res.json({ user: safeUser(user) });
});

// POST /api/users - Create user (manager only)
router.post('/users', requireAuth, requireManager, (req, res) => {
  const { name, email, password, role, department, skills } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const existing = helpers.getUserByEmail.get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const id = genId();
  const hashed = bcrypt.hashSync(password, 12);
  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  helpers.createUser.run(id, name, email.toLowerCase(), hashed, role || 'user', department || '', avatar, JSON.stringify(skills || []));
  auditLog(req.user.id, 'create_user', 'user', id, { name, email, role }, req.ip);
  res.status(201).json({ user: safeUser(helpers.getUserById.get(id)) });
});

// PUT /api/users/:id - Update user
router.put('/users/:id', requireAuth, (req, res) => {
  // Users can update own profile; managers can update anyone
  if (req.user.role === 'user' && req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });

  const user = helpers.getUserById.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, role, department, skills, status, max_chats } = req.body;
  helpers.updateUser.run(
    name || user.name, email || user.email,
    req.user.role === 'manager' ? (role || user.role) : user.role,
    department || user.department,
    user.avatar,
    JSON.stringify(skills || tryParse(user.skills, [])),
    status || user.status,
    max_chats || user.max_chats,
    new Date().toISOString(),
    req.params.id
  );
  auditLog(req.user.id, 'update_user', 'user', req.params.id, { name, role }, req.ip);
  res.json({ user: safeUser(helpers.getUserById.get(req.params.id)) });
});

// PUT /api/users/:id/status - Update agent availability
router.put('/users/:id/status', requireAuth, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  if (!['online', 'busy', 'away', 'offline'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  helpers.updateUserStatus.run(status, req.params.id);
  broadcastToManagers({ type: 'agent_status', userId: req.params.id, status });
  res.json({ success: true });
});

// DELETE /api/users/:id
router.delete('/users/:id', requireAuth, requireManager, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  helpers.deleteUser.run(req.params.id);
  auditLog(req.user.id, 'delete_user', 'user', req.params.id, {}, req.ip);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// CHAT ROUTES
// ─────────────────────────────────────────────

// GET /api/chats - Get chats relevant to current user
router.get('/chats', requireAuth, (req, res) => {
  let chats;
  const { status } = req.query;
  if (req.user.role === 'manager') {
    chats = helpers.getAllChats.all();
  } else if (req.user.role === 'agent') {
    chats = db.prepare('SELECT * FROM chats WHERE (agent_id=? OR status=\'queued\') ORDER BY updated_at DESC').all(req.user.id);
  } else {
    chats = helpers.getChatsByUser.all(req.user.id);
  }
  if (status) chats = chats.filter(c => c.status === status);
  chats = chats.map(c => ({ ...c, tags: tryParse(c.tags, []) }));
  res.json({ chats });
});

// GET /api/chats/:id - Get single chat with messages
router.get('/chats/:id', requireAuth, (req, res) => {
  const chat = helpers.getChatById.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  // Access control
  if (req.user.role === 'user' && chat.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (req.user.role === 'agent' && chat.agent_id !== req.user.id && chat.status !== 'queued') return res.status(403).json({ error: 'Forbidden' });

  const messages = helpers.getMessagesByChat.all(chat.id);
  const notes = (req.user.role !== 'user') ? helpers.getNotesByChat.all(chat.id) : [];

  // Mark messages as read
  helpers.markMessagesRead.run(chat.id, req.user.id);

  res.json({
    chat: { ...chat, tags: tryParse(chat.tags, []) },
    messages,
    notes,
    user: safeUser(helpers.getUserById.get(chat.user_id)),
    agent: chat.agent_id ? safeUser(helpers.getUserById.get(chat.agent_id)) : null,
  });
});

// POST /api/chats - Create new chat (start support request)
router.post('/chats', requireAuth, (req, res) => {
  const { subject, category, priority, message, tags } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

  const chatId = genId();

  // Auto-assign: find available online agent with lowest load
  let agentId = null;
  let status = 'queued';
  const agents = helpers.getUsersByRole.all('agent').filter(a => a.status === 'online' && (a.current_chats || 0) < (a.max_chats || 5));
  if (agents.length > 0) {
    // Skill-based routing: prefer agent with matching skill
    const skilled = agents.filter(a => tryParse(a.skills, []).includes(category));
    const pool = skilled.length > 0 ? skilled : agents;
    agentId = pool.sort((a, b) => (a.current_chats || 0) - (b.current_chats || 0))[0].id;
    status = 'active';
  }

  // Determine queue position
  const queuePos = status === 'queued' ? (helpers.getQueuedChats.all().length + 1) : null;

  helpers.createChat.run(chatId, req.user.id, agentId, status, priority || 'medium', subject, category || 'general', JSON.stringify(tags || []), queuePos);

  // Add initial message
  const msgId = genId();
  helpers.createMessage.run(msgId, chatId, req.user.id, 'text', message, null, null, null, null);

  // If agent assigned, add system welcome message
  if (agentId) {
    const agent = helpers.getUserById.get(agentId);
    helpers.createMessage.run(genId(), chatId, agentId, 'text',
      `Hello ${req.user.name}! I am ${agent.name} from IMARAT IT Support. I have received your request and will assist you right away.`,
      null, null, null, null);
    helpers.updateCurrentChats.run(1, agentId);
    // Notify agent
    notifyUser(agentId, 'new_chat', 'New chat assigned', `New ${priority || 'medium'} priority chat from ${req.user.name}: ${subject}`, chatId);
    // Broadcast to agent
    sendToUser(agentId, { type: 'new_chat', chatId });
  }

  auditLog(req.user.id, 'create_chat', 'chat', chatId, { subject, category, agentId }, req.ip);
  const chat = helpers.getChatById.get(chatId);
  const messages = helpers.getMessagesByChat.all(chatId);
  res.status(201).json({ chat: { ...chat, tags: tryParse(chat.tags, []) }, messages });
});

// POST /api/chats/:id/messages - Send a message
router.post('/chats/:id/messages', requireAuth, upload.single('file'), (req, res) => {
  const chat = helpers.getChatById.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (chat.status === 'resolved' || chat.status === 'closed') return res.status(400).json({ error: 'Chat is closed' });

  // Access control
  if (req.user.role === 'user' && chat.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (req.user.role === 'agent' && chat.agent_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const msgId = genId();
  let text = req.body.text || '';
  let fileName = null, fileSize = null, fileType = null, filePath = null;
  let msgType = 'text';

  if (req.file) {
    msgType = 'file';
    fileName = req.file.originalname;
    fileSize = req.file.size;
    fileType = req.file.mimetype;
    filePath = `/uploads/${req.file.filename}`;
    if (!text) text = `[File: ${fileName}]`;
  }

  if (!text.trim()) return res.status(400).json({ error: 'Message text is required' });

  helpers.createMessage.run(msgId, chat.id, req.user.id, msgType, text, fileName, fileSize, fileType, filePath);

  // Update chat timestamp
  db.prepare('UPDATE chats SET updated_at=datetime(\'now\') WHERE id=?').run(chat.id);

  const message = db.prepare('SELECT * FROM messages WHERE id=?').get(msgId);

  // Broadcast to other participant
  const payload = { type: 'new_message', chatId: chat.id, message };
  const recipientId = req.user.id === chat.user_id ? chat.agent_id : chat.user_id;
  if (recipientId) {
    sendToUser(recipientId, payload);
    broadcastToManagers(payload);
    // Notify recipient
    const notifTitle = req.user.role === 'agent' ? `${req.user.name} replied to your chat` : `New message from ${req.user.name}`;
    notifyUser(recipientId, 'new_message', notifTitle, text.slice(0, 100), chat.id);
  }

  auditLog(req.user.id, 'send_message', 'message', msgId, { chatId: chat.id }, req.ip);
  res.status(201).json({ message });
});

// POST /api/chats/:id/notes - Add internal note (agents/managers)
router.post('/chats/:id/notes', requireAuth, requireAgent, (req, res) => {
  const chat = helpers.getChatById.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Note text required' });

  const id = genId();
  helpers.createNote.run(id, chat.id, req.user.id, text);
  const note = db.prepare('SELECT * FROM internal_notes WHERE id=?').get(id);
  res.status(201).json({ note });
});

// PUT /api/chats/:id/assign - Assign/reassign chat to agent
router.put('/chats/:id/assign', requireAuth, (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
  const chat = helpers.getChatById.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const { agentId } = req.body;

  // Decrement old agent
  if (chat.agent_id && chat.agent_id !== agentId) {
    helpers.updateCurrentChats.run(-1, chat.agent_id);
  }

  helpers.updateChatAgent.run(agentId, chat.id);
  helpers.updateCurrentChats.run(1, agentId);

  const agent = helpers.getUserById.get(agentId);
  helpers.createMessage.run(genId(), chat.id, null, 'system', `Chat assigned to ${agent?.name || 'agent'}.`, null, null, null, null);

  // Notify new agent
  notifyUser(agentId, 'new_chat', 'Chat assigned to you', `You have been assigned a chat from ${helpers.getUserById.get(chat.user_id)?.name}`, chat.id);
  sendToUser(agentId, { type: 'chat_assigned', chatId: chat.id });

  auditLog(req.user.id, 'assign_chat', 'chat', chat.id, { agentId }, req.ip);
  res.json({ chat: helpers.getChatById.get(chat.id) });
});

// PUT /api/chats/:id/accept - Agent accepts queued chat
router.put('/chats/:id/accept', requireAuth, requireAgent, (req, res) => {
  const chat = helpers.getChatById.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (chat.status !== 'queued') return res.status(400).json({ error: 'Chat is not queued' });

  const agent = helpers.getUserById.get(req.user.id);
  if ((agent.current_chats || 0) >= (agent.max_chats || 5)) return res.status(400).json({ error: 'Max concurrent chats reached' });

  helpers.updateChatAgent.run(req.user.id, chat.id);
  helpers.updateCurrentChats.run(1, req.user.id);
  helpers.createMessage.run(genId(), chat.id, req.user.id, 'text',
    `Hello! I am ${agent.name} from IMARAT IT Support. I have picked up your request and will assist you now.`,
    null, null, null, null);

  // Notify user
  notifyUser(chat.user_id, 'agent_joined', 'Agent joined your chat', `${agent.name} has joined your support chat.`, chat.id);
  sendToUser(chat.user_id, { type: 'agent_joined', chatId: chat.id });
  broadcastToManagers({ type: 'chat_accepted', chatId: chat.id, agentId: req.user.id });

  auditLog(req.user.id, 'accept_chat', 'chat', chat.id, {}, req.ip);
  res.json({ chat: helpers.getChatById.get(chat.id), messages: helpers.getMessagesByChat.all(chat.id) });
});

// PUT /api/chats/:id/resolve - Resolve a chat
router.put('/chats/:id/resolve', requireAuth, requireAgent, (req, res) => {
  const chat = helpers.getChatById.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const { resolution } = req.body;
  db.prepare('UPDATE chats SET status=\'resolved\',resolution=?,resolved_at=datetime(\'now\'),updated_at=datetime(\'now\') WHERE id=?')
    .run(resolution || null, chat.id);

  helpers.createMessage.run(genId(), chat.id, req.user.id, 'text',
    'I have marked this chat as resolved. Please rate your experience below. If this issue recurs, feel free to contact us again.',
    null, null, null, null);

  if (chat.agent_id) helpers.updateCurrentChats.run(-1, chat.agent_id);

  notifyUser(chat.user_id, 'chat_resolved', 'Your chat has been resolved', `Your support chat "${chat.subject}" has been marked as resolved.`, chat.id);
  sendToUser(chat.user_id, { type: 'chat_resolved', chatId: chat.id });
  broadcastToManagers({ type: 'chat_resolved', chatId: chat.id });

  auditLog(req.user.id, 'resolve_chat', 'chat', chat.id, {}, req.ip);
  res.json({ success: true });
});

// PUT /api/chats/:id/rate - Rate a resolved chat
router.put('/chats/:id/rate', requireAuth, (req, res) => {
  const chat = helpers.getChatById.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (chat.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

  helpers.rateChat.run(rating, chat.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// TICKET ROUTES
// ─────────────────────────────────────────────

// GET /api/tickets
router.get('/tickets', requireAuth, (req, res) => {
  let tickets;
  if (req.user.role === 'manager') {
    tickets = helpers.getAllTickets.all();
  } else if (req.user.role === 'agent') {
    tickets = db.prepare('SELECT * FROM tickets WHERE agent_id=? OR status=\'open\' ORDER BY updated_at DESC').all(req.user.id);
  } else {
    tickets = helpers.getTicketsByUser.all(req.user.id);
  }
  const { status, priority, category, search } = req.query;
  if (status) tickets = tickets.filter(t => t.status === status);
  if (priority) tickets = tickets.filter(t => t.priority === priority);
  if (category) tickets = tickets.filter(t => t.category === category);
  if (search) {
    const q = search.toLowerCase();
    tickets = tickets.filter(t => t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.ticket_number.toLowerCase().includes(q));
  }
  tickets = tickets.map(t => ({ ...t, tags: tryParse(t.tags, []) }));
  res.json({ tickets });
});

// GET /api/tickets/:id
router.get('/tickets/:id', requireAuth, (req, res) => {
  const ticket = helpers.getTicketById.get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'user' && ticket.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const comments = helpers.getCommentsByTicket.all(ticket.id).filter(c => req.user.role !== 'user' || !c.is_internal);
  const attachments = db.prepare('SELECT * FROM ticket_attachments WHERE ticket_id=?').all(ticket.id);

  res.json({
    ticket: { ...ticket, tags: tryParse(ticket.tags, []) },
    comments,
    attachments,
    user: safeUser(helpers.getUserById.get(ticket.user_id)),
    agent: ticket.agent_id ? safeUser(helpers.getUserById.get(ticket.agent_id)) : null,
  });
});

// POST /api/tickets
router.post('/tickets', requireAuth, (req, res) => {
  const { subject, description, category, priority, chatId, tags } = req.body;
  if (!subject || !description) return res.status(400).json({ error: 'Subject and description are required' });

  const id = genId();
  const count = helpers.countTickets.get().count;
  const ticketNumber = `IIM-${String(count + 1).padStart(4, '0')}`;

  // Auto-assign agent
  let agentId = null;
  if (chatId) {
    const chat = helpers.getChatById.get(chatId);
    agentId = chat?.agent_id || null;
  }
  if (!agentId) {
    const agents = helpers.getUsersByRole.all('agent').filter(a => a.status === 'online');
    agentId = agents.length > 0 ? agents[0].id : null;
  }

  const sla = { low: [4, 24], medium: [2, 8], high: [1, 4], critical: [0.5, 2] };
  const [slaR, slaRes] = sla[priority] || sla.medium;
  const due = new Date(Date.now() + slaRes * 3600000).toISOString();

  helpers.createTicket.run(id, ticketNumber, chatId || null, req.user.id, agentId, 'open', priority || 'medium', subject, description, category || 'general', JSON.stringify(tags || []), due, slaR, slaRes);

  if (agentId) {
    notifyUser(agentId, 'new_ticket', `New ticket ${ticketNumber}`, `${subject} — assigned to you.`, null, id);
  }
  notifyUser(req.user.id, 'ticket_created', `Ticket ${ticketNumber} created`, `Your ticket has been submitted. Reference: ${ticketNumber}`, null, id);

  // If from chat, add system message
  if (chatId) {
    helpers.createMessage.run(genId(), chatId, null, 'system', `This chat has been escalated to ticket ${ticketNumber}. Our team will follow up.`, null, null, null, null);
  }

  auditLog(req.user.id, 'create_ticket', 'ticket', id, { ticketNumber, subject }, req.ip);
  const ticket = helpers.getTicketById.get(id);
  res.status(201).json({ ticket: { ...ticket, tags: tryParse(ticket.tags, []) } });
});

// PUT /api/tickets/:id - Update ticket
router.put('/tickets/:id', requireAuth, (req, res) => {
  const ticket = helpers.getTicketById.get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });

  const { agentId, status, priority, subject, description, category, tags, resolution } = req.body;
  const resolvedAt = status === 'resolved' ? new Date().toISOString() : ticket.resolved_at;
  const due = ticket.due_date;

  helpers.updateTicket.run(
    agentId ?? ticket.agent_id, status ?? ticket.status, priority ?? ticket.priority,
    subject ?? ticket.subject, description ?? ticket.description, category ?? ticket.category,
    JSON.stringify(tags ?? tryParse(ticket.tags, [])), due, ticket.sla_breached,
    resolution ?? ticket.resolution, resolvedAt, ticket.id
  );

  // Notify user on status change
  if (status && status !== ticket.status) {
    notifyUser(ticket.user_id, 'ticket_update', `Ticket ${ticket.ticket_number} updated`, `Status changed to ${status}.`, null, ticket.id);
  }
  // Notify new agent on reassignment
  if (agentId && agentId !== ticket.agent_id) {
    notifyUser(agentId, 'ticket_assigned', `Ticket ${ticket.ticket_number} assigned to you`, subject || ticket.subject, null, ticket.id);
  }

  auditLog(req.user.id, 'update_ticket', 'ticket', ticket.id, { status, agentId }, req.ip);
  const updated = helpers.getTicketById.get(ticket.id);
  res.json({ ticket: { ...updated, tags: tryParse(updated.tags, []) } });
});

// POST /api/tickets/:id/comments
router.post('/tickets/:id/comments', requireAuth, (req, res) => {
  const ticket = helpers.getTicketById.get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'user' && ticket.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { text, isInternal } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' });

  const id = genId();
  const internal = isInternal && req.user.role !== 'user' ? 1 : 0;
  helpers.createTicketComment.run(id, ticket.id, req.user.id, text, internal);

  // Update ticket timestamp
  db.prepare('UPDATE tickets SET updated_at=datetime(\'now\') WHERE id=?').run(ticket.id);

  // Notify other party
  const notifyId = req.user.id === ticket.user_id ? ticket.agent_id : ticket.user_id;
  if (notifyId && !internal) {
    notifyUser(notifyId, 'ticket_comment', `Comment on ${ticket.ticket_number}`, text.slice(0, 100), null, ticket.id);
  }

  auditLog(req.user.id, 'ticket_comment', 'ticket_comment', id, { ticketId: ticket.id, internal }, req.ip);
  const comment = db.prepare('SELECT * FROM ticket_comments WHERE id=?').get(id);
  res.status(201).json({ comment });
});

// POST /api/tickets/:id/attachments
router.post('/tickets/:id/attachments', requireAuth, upload.single('file'), (req, res) => {
  const ticket = helpers.getTicketById.get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (!req.file) return res.status(400).json({ error: 'File required' });

  const id = genId();
  db.prepare('INSERT INTO ticket_attachments (id,ticket_id,user_id,file_name,file_size,file_type,file_path) VALUES (?,?,?,?,?,?,?)')
    .run(id, ticket.id, req.user.id, req.file.originalname, req.file.size, req.file.mimetype, `/uploads/${req.file.filename}`);

  res.status(201).json({ attachment: db.prepare('SELECT * FROM ticket_attachments WHERE id=?').get(id) });
});

// ─────────────────────────────────────────────
// KNOWLEDGE BASE ROUTES
// ─────────────────────────────────────────────

// GET /api/kb
router.get('/kb', requireAuth, (req, res) => {
  const { search, category } = req.query;
  let articles;
  if (search) {
    const q = `%${search}%`;
    articles = helpers.searchKbArticles.all(q, q, q);
  } else {
    articles = req.user.role === 'manager' ? helpers.getAllKbArticlesAdmin.all() : helpers.getAllKbArticles.all();
  }
  if (category) articles = articles.filter(a => a.category === category);
  articles = articles.map(a => ({ ...a, tags: tryParse(a.tags, []) }));
  res.json({ articles });
});

// GET /api/kb/:id
router.get('/kb/:id', requireAuth, (req, res) => {
  const article = helpers.getKbArticleById.get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  if (!article.published && req.user.role === 'user') return res.status(404).json({ error: 'Article not found' });
  helpers.incrementKbViews.run(article.id);
  res.json({ article: { ...article, tags: tryParse(article.tags, []) } });
});

// POST /api/kb
router.post('/kb', requireAuth, requireAgent, (req, res) => {
  const { title, content, category, tags, published } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const id = genId();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 6);
  helpers.createKbArticle.run(id, title, slug, content, category || 'General', JSON.stringify(tags || []), req.user.id, published ? 1 : 0);

  auditLog(req.user.id, 'create_kb_article', 'kb_article', id, { title }, req.ip);
  res.status(201).json({ article: helpers.getKbArticleById.get(id) });
});

// PUT /api/kb/:id
router.put('/kb/:id', requireAuth, requireAgent, (req, res) => {
  const article = helpers.getKbArticleById.get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  const { title, content, category, tags, published, featured } = req.body;
  helpers.updateKbArticle.run(
    title ?? article.title, content ?? article.content, category ?? article.category,
    JSON.stringify(tags ?? tryParse(article.tags, [])),
    published !== undefined ? (published ? 1 : 0) : article.published,
    featured !== undefined ? (featured ? 1 : 0) : article.featured,
    article.id
  );
  auditLog(req.user.id, 'update_kb_article', 'kb_article', article.id, { title }, req.ip);
  res.json({ article: { ...helpers.getKbArticleById.get(article.id), tags: tryParse(article.tags, []) } });
});

// DELETE /api/kb/:id
router.delete('/kb/:id', requireAuth, requireManager, (req, res) => {
  helpers.deleteKbArticle.run(req.params.id);
  auditLog(req.user.id, 'delete_kb_article', 'kb_article', req.params.id, {}, req.ip);
  res.json({ success: true });
});

// POST /api/kb/:id/vote
router.post('/kb/:id/vote', requireAuth, (req, res) => {
  const { helpful } = req.body;
  helpers.voteKbArticle.run(helpful ? 1 : 0, helpful ? 0 : 1, req.params.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// NOTIFICATIONS ROUTES
// ─────────────────────────────────────────────

router.get('/notifications', requireAuth, (req, res) => {
  const notifications = helpers.getNotificationsByUser.all(req.user.id);
  const unread = helpers.getUnreadCount.get(req.user.id).count;
  res.json({ notifications, unread });
});

router.put('/notifications/:id/read', requireAuth, (req, res) => {
  helpers.markNotificationRead.run(req.params.id, req.user.id);
  res.json({ success: true });
});

router.put('/notifications/read-all', requireAuth, (req, res) => {
  helpers.markAllNotificationsRead.run(req.user.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// QUICK REPLIES ROUTES
// ─────────────────────────────────────────────

router.get('/quick-replies', requireAuth, requireAgent, (req, res) => {
  const replies = helpers.getAllQuickReplies.all();
  res.json({ replies });
});

router.post('/quick-replies', requireAuth, requireAgent, (req, res) => {
  const { title, text, category } = req.body;
  if (!title || !text) return res.status(400).json({ error: 'Title and text required' });
  const id = genId();
  helpers.createQuickReply.run(id, title, text, category || 'general', req.user.id);
  res.status(201).json({ reply: db.prepare('SELECT * FROM quick_replies WHERE id=?').get(id) });
});

router.put('/quick-replies/:id', requireAuth, requireAgent, (req, res) => {
  const { title, text, category } = req.body;
  helpers.updateQuickReply.run(title, text, category, req.params.id);
  res.json({ reply: db.prepare('SELECT * FROM quick_replies WHERE id=?').get(req.params.id) });
});

router.delete('/quick-replies/:id', requireAuth, requireAgent, (req, res) => {
  helpers.deleteQuickReply.run(req.params.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// ANALYTICS ROUTES
// ─────────────────────────────────────────────

router.get('/analytics/summary', requireAuth, (req, res) => {
  const totalChats = db.prepare('SELECT COUNT(*) as c FROM chats').get().c;
  const activeChats = db.prepare('SELECT COUNT(*) as c FROM chats WHERE status=\'active\'').get().c;
  const queuedChats = db.prepare('SELECT COUNT(*) as c FROM chats WHERE status=\'queued\'').get().c;
  const resolvedChats = db.prepare('SELECT COUNT(*) as c FROM chats WHERE status=\'resolved\'').get().c;
  const totalTickets = db.prepare('SELECT COUNT(*) as c FROM tickets').get().c;
  const openTickets = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE status IN (\'open\',\'in_progress\')').get().c;
  const resolvedTickets = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE status=\'resolved\'').get().c;
  const slaBreached = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE sla_breached=1').get().c;
  const avgRating = db.prepare('SELECT AVG(rating) as avg FROM chats WHERE rating IS NOT NULL').get().avg;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=\'user\'').get().c;
  const totalAgents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=\'agent\'').get().c;
  const onlineAgents = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=\'agent\' AND status=\'online\'').get().c;

  res.json({
    totalChats, activeChats, queuedChats, resolvedChats,
    totalTickets, openTickets, resolvedTickets, slaBreached,
    avgRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
    totalUsers, totalAgents, onlineAgents,
    resolutionRate: totalChats > 0 ? Math.round((resolvedChats / totalChats) * 100) : 0,
    slaComplianceRate: totalTickets > 0 ? Math.round(((totalTickets - slaBreached) / totalTickets) * 100) : 100,
  });
});

router.get('/analytics/agents', requireAuth, requireManager, (req, res) => {
  const agents = helpers.getUsersByRole.all('agent').map(agent => {
    const resolved = db.prepare('SELECT COUNT(*) as c FROM chats WHERE agent_id=? AND status=\'resolved\'').get(agent.id).c;
    const tickets = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE agent_id=? AND status=\'resolved\'').get(agent.id).c;
    const avgRating = db.prepare('SELECT AVG(rating) as avg FROM chats WHERE agent_id=? AND rating IS NOT NULL').get(agent.id).avg;
    return {
      ...safeUser(agent),
      resolved_chats: resolved,
      resolved_tickets: tickets,
      avg_rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
    };
  });
  res.json({ agents });
});

router.get('/analytics/categories', requireAuth, (req, res) => {
  const chatCategories = db.prepare('SELECT category, COUNT(*) as count FROM chats GROUP BY category ORDER BY count DESC').all();
  const ticketCategories = db.prepare('SELECT category, COUNT(*) as count FROM tickets GROUP BY category ORDER BY count DESC').all();
  res.json({ chatCategories, ticketCategories });
});

router.get('/analytics/volume', requireAuth, (req, res) => {
  // Last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const chats = db.prepare('SELECT COUNT(*) as c FROM chats WHERE date(created_at)=?').get(date).c;
    const tickets = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE date(created_at)=?').get(date).c;
    days.push({ date, chats, tickets });
  }
  res.json({ days });
});

// ─────────────────────────────────────────────
// SETTINGS ROUTES
// ─────────────────────────────────────────────

router.get('/settings', requireAuth, requireManager, (req, res) => {
  const rows = helpers.getAllSettings.all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json({ settings });
});

router.put('/settings', requireAuth, requireManager, (req, res) => {
  const { settings } = req.body;
  if (!settings) return res.status(400).json({ error: 'Settings object required' });
  const update = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      helpers.setSetting.run(key, String(value));
    }
  });
  update();
  auditLog(req.user.id, 'update_settings', 'settings', 'system', {}, req.ip);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

router.get('/audit-log', requireAuth, requireManager, (req, res) => {
  const logs = helpers.getAuditLog.all();
  res.json({ logs });
});

// ─────────────────────────────────────────────
// AI ASSIST (uses Anthropic API if key present)
// ─────────────────────────────────────────────

router.post('/ai/suggest', requireAuth, requireAgent, async (req, res) => {
  const { chatId, prompt } = req.body;
  const chat = chatId ? helpers.getChatById.get(chatId) : null;
  const messages = chat ? helpers.getMessagesByChat.all(chat.id) : [];
  const context = messages.slice(-6).map(m => `${m.sender_id === chat?.user_id ? 'User' : 'Agent'}: ${m.text}`).join('\n');

  // If Anthropic key present, use real AI
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: 'You are an IT support assistant for IMARAT company. Suggest a helpful, concise, professional reply for the agent. Reply with ONLY the suggested message text, no preamble.',
          messages: [{ role: 'user', content: `Chat context:\n${context}\n\nSuggest a reply for the agent:` }],
        }),
      });
      const data = await response.json();
      return res.json({ suggestion: data.content?.[0]?.text || '' });
    } catch (e) {
      // Fall through to static suggestions
    }
  }

  // Static smart suggestions based on context
  const suggestions = [
    'Based on the information provided, I recommend checking the Event Viewer logs (Windows Logs > Application) for related error codes which will help us identify the root cause.',
    'This appears to be an authentication configuration issue. I will verify your account status in Active Directory and check for any relevant Group Policy conflicts.',
    'I can see this is a connectivity issue. Could you confirm whether this problem occurs on other devices on the same network? This will help determine if it is device-specific.',
    'I have investigated the issue and found a resolution. Please follow these steps carefully and let me know if you encounter any difficulties.',
    'For this type of issue, I recommend running the Windows Network Diagnostics tool which can automatically identify and resolve common connectivity problems.',
    'I have escalated this to our specialist team and they will be in contact with you within the hour. Your ticket reference is being created now.',
  ];
  res.json({ suggestion: suggestions[Math.floor(Math.random() * suggestions.length)] });
});

router.post('/ai/summarize', requireAuth, requireAgent, async (req, res) => {
  const { chatId } = req.body;
  const chat = helpers.getChatById.get(chatId);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });

  const messages = helpers.getMessagesByChat.all(chat.id);
  const transcript = messages.map(m => `${m.sender_id === chat.user_id ? 'User' : 'Agent'}: ${m.text}`).join('\n');

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          system: 'Summarize this IT support chat in 2-3 sentences. Include: issue reported, steps taken, and current status.',
          messages: [{ role: 'user', content: transcript }],
        }),
      });
      const data = await response.json();
      return res.json({ summary: data.content?.[0]?.text || '' });
    } catch (e) {}
  }

  res.json({ summary: `Support chat regarding: "${chat.subject}". ${messages.length} messages exchanged between user and agent. Issue is currently ${chat.status}. Category: ${chat.category}.` });
});

module.exports = router;
