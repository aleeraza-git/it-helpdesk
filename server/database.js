/**
 * IMARAT IT Support - Database Layer
 * Uses SQLite via better-sqlite3 for zero-configuration deployment.
 * In production, swap the connection string for PostgreSQL via pg or Prisma.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/imarat.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────
// SCHEMA INITIALIZATION
// ─────────────────────────────────────────────
db.exec(`
  -- Users table: supports user, agent, and manager roles
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','agent','manager')),
    department  TEXT DEFAULT '',
    avatar      TEXT DEFAULT '',
    status      TEXT DEFAULT 'offline' CHECK(status IN ('online','busy','away','offline')),
    skills      TEXT DEFAULT '[]',
    max_chats   INTEGER DEFAULT 5,
    current_chats INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    last_seen   TEXT DEFAULT (datetime('now'))
  );

  -- Chats table: live support conversations
  CREATE TABLE IF NOT EXISTS chats (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT DEFAULT 'queued' CHECK(status IN ('queued','active','resolved','closed')),
    priority        TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
    subject         TEXT NOT NULL,
    category        TEXT DEFAULT 'general',
    tags            TEXT DEFAULT '[]',
    queue_position  INTEGER,
    rating          INTEGER,
    resolution      TEXT,
    resolved_at     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
  CREATE INDEX IF NOT EXISTS idx_chats_agent ON chats(agent_id);
  CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);

  -- Messages table: individual chat messages
  CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    chat_id     TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    type        TEXT DEFAULT 'text' CHECK(type IN ('text','file','system','ai')),
    text        TEXT NOT NULL,
    file_name   TEXT,
    file_size   INTEGER,
    file_type   TEXT,
    file_path   TEXT,
    read_at     TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);

  -- Internal notes: agent-only notes on chats
  CREATE TABLE IF NOT EXISTS internal_notes (
    id          TEXT PRIMARY KEY,
    chat_id     TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    agent_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Tickets table: formal issue tracking
  CREATE TABLE IF NOT EXISTS tickets (
    id              TEXT PRIMARY KEY,
    ticket_number   TEXT UNIQUE NOT NULL,
    chat_id         TEXT REFERENCES chats(id) ON DELETE SET NULL,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','pending','resolved','closed')),
    priority        TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
    subject         TEXT NOT NULL,
    description     TEXT NOT NULL,
    category        TEXT DEFAULT 'general',
    tags            TEXT DEFAULT '[]',
    due_date        TEXT,
    sla_response    REAL DEFAULT 2,
    sla_resolution  REAL DEFAULT 8,
    sla_breached    INTEGER DEFAULT 0,
    first_response_at TEXT,
    resolution      TEXT,
    resolved_at     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_agent ON tickets(agent_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

  -- Ticket comments: public and internal thread
  CREATE TABLE IF NOT EXISTS ticket_comments (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Ticket attachments
  CREATE TABLE IF NOT EXISTS ticket_attachments (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users(id),
    file_name   TEXT NOT NULL,
    file_size   INTEGER,
    file_type   TEXT,
    file_path   TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Knowledge base articles
  CREATE TABLE IF NOT EXISTS kb_articles (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    content     TEXT NOT NULL,
    category    TEXT NOT NULL,
    tags        TEXT DEFAULT '[]',
    author_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    views       INTEGER DEFAULT 0,
    helpful     INTEGER DEFAULT 0,
    not_helpful INTEGER DEFAULT 0,
    published   INTEGER DEFAULT 1,
    featured    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_kb_category ON kb_articles(category);
  CREATE INDEX IF NOT EXISTS idx_kb_published ON kb_articles(published);

  -- Notifications
  CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    text        TEXT NOT NULL,
    chat_id     TEXT REFERENCES chats(id) ON DELETE CASCADE,
    ticket_id   TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    read        INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

  -- Quick replies / templates
  CREATE TABLE IF NOT EXISTS quick_replies (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    text        TEXT NOT NULL,
    category    TEXT DEFAULT 'general',
    created_by  TEXT REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Audit log: complete trail of all significant actions
  CREATE TABLE IF NOT EXISTS audit_log (
    id          TEXT PRIMARY KEY,
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT,
    details     TEXT DEFAULT '{}',
    ip_address  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);

  -- Chat routing rules
  CREATE TABLE IF NOT EXISTS routing_rules (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT,
    priority    TEXT,
    agent_id    TEXT REFERENCES users(id),
    enabled     INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- System settings (key-value)
  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT DEFAULT (datetime('now'))
  );
`);

// ─────────────────────────────────────────────
// QUERY HELPERS
// ─────────────────────────────────────────────
const helpers = {
  // Users
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getAllUsers: db.prepare('SELECT * FROM users ORDER BY name'),
  getUsersByRole: db.prepare('SELECT * FROM users WHERE role = ? ORDER BY name'),
  createUser: db.prepare('INSERT INTO users (id,name,email,password,role,department,avatar,skills) VALUES (?,?,?,?,?,?,?,?)'),
  updateUser: db.prepare('UPDATE users SET name=?,email=?,role=?,department=?,avatar=?,skills=?,status=?,max_chats=?,last_seen=? WHERE id=?'),
  updateUserStatus: db.prepare('UPDATE users SET status=?,last_seen=datetime(\'now\') WHERE id=?'),
  updateCurrentChats: db.prepare('UPDATE users SET current_chats=current_chats+? WHERE id=?'),
  deleteUser: db.prepare('DELETE FROM users WHERE id=?'),

  // Chats
  getChatById: db.prepare('SELECT * FROM chats WHERE id=?'),
  getChatsByUser: db.prepare('SELECT * FROM chats WHERE user_id=? ORDER BY updated_at DESC'),
  getChatsByAgent: db.prepare('SELECT * FROM chats WHERE agent_id=? ORDER BY updated_at DESC'),
  getQueuedChats: db.prepare('SELECT * FROM chats WHERE status=\'queued\' ORDER BY created_at ASC'),
  getAllActiveChats: db.prepare('SELECT * FROM chats WHERE status IN (\'active\',\'queued\') ORDER BY updated_at DESC'),
  getAllChats: db.prepare('SELECT * FROM chats ORDER BY updated_at DESC'),
  createChat: db.prepare('INSERT INTO chats (id,user_id,agent_id,status,priority,subject,category,tags,queue_position) VALUES (?,?,?,?,?,?,?,?,?)'),
  updateChat: db.prepare('UPDATE chats SET agent_id=?,status=?,priority=?,subject=?,category=?,tags=?,queue_position=?,resolution=?,resolved_at=?,updated_at=datetime(\'now\') WHERE id=?'),
  updateChatStatus: db.prepare('UPDATE chats SET status=?,updated_at=datetime(\'now\') WHERE id=?'),
  updateChatAgent: db.prepare('UPDATE chats SET agent_id=?,status=\'active\',queue_position=NULL,updated_at=datetime(\'now\') WHERE id=?'),
  rateChat: db.prepare('UPDATE chats SET rating=?,updated_at=datetime(\'now\') WHERE id=?'),

  // Messages
  getMessagesByChat: db.prepare('SELECT * FROM messages WHERE chat_id=? ORDER BY created_at ASC'),
  createMessage: db.prepare('INSERT INTO messages (id,chat_id,sender_id,type,text,file_name,file_size,file_type,file_path) VALUES (?,?,?,?,?,?,?,?,?)'),
  markMessagesRead: db.prepare('UPDATE messages SET read_at=datetime(\'now\') WHERE chat_id=? AND sender_id!=? AND read_at IS NULL'),

  // Internal notes
  getNotesByChat: db.prepare('SELECT * FROM internal_notes WHERE chat_id=? ORDER BY created_at ASC'),
  createNote: db.prepare('INSERT INTO internal_notes (id,chat_id,agent_id,text) VALUES (?,?,?,?)'),

  // Tickets
  getTicketById: db.prepare('SELECT * FROM tickets WHERE id=?'),
  getTicketsByUser: db.prepare('SELECT * FROM tickets WHERE user_id=? ORDER BY updated_at DESC'),
  getTicketsByAgent: db.prepare('SELECT * FROM tickets WHERE agent_id=? ORDER BY updated_at DESC'),
  getAllTickets: db.prepare('SELECT * FROM tickets ORDER BY updated_at DESC'),
  createTicket: db.prepare('INSERT INTO tickets (id,ticket_number,chat_id,user_id,agent_id,status,priority,subject,description,category,tags,due_date,sla_response,sla_resolution) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'),
  updateTicket: db.prepare('UPDATE tickets SET agent_id=?,status=?,priority=?,subject=?,description=?,category=?,tags=?,due_date=?,sla_breached=?,resolution=?,resolved_at=?,updated_at=datetime(\'now\') WHERE id=?'),
  updateTicketStatus: db.prepare('UPDATE tickets SET status=?,updated_at=datetime(\'now\') WHERE id=?'),
  countTickets: db.prepare('SELECT COUNT(*) as count FROM tickets'),

  // Ticket comments
  getCommentsByTicket: db.prepare('SELECT * FROM ticket_comments WHERE ticket_id=? ORDER BY created_at ASC'),
  createTicketComment: db.prepare('INSERT INTO ticket_comments (id,ticket_id,user_id,text,is_internal) VALUES (?,?,?,?,?)'),

  // KB
  getKbArticleById: db.prepare('SELECT * FROM kb_articles WHERE id=?'),
  getAllKbArticles: db.prepare('SELECT * FROM kb_articles WHERE published=1 ORDER BY updated_at DESC'),
  getAllKbArticlesAdmin: db.prepare('SELECT * FROM kb_articles ORDER BY updated_at DESC'),
  searchKbArticles: db.prepare('SELECT * FROM kb_articles WHERE published=1 AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)'),
  createKbArticle: db.prepare('INSERT INTO kb_articles (id,title,slug,content,category,tags,author_id,published) VALUES (?,?,?,?,?,?,?,?)'),
  updateKbArticle: db.prepare('UPDATE kb_articles SET title=?,content=?,category=?,tags=?,published=?,featured=?,updated_at=datetime(\'now\') WHERE id=?'),
  incrementKbViews: db.prepare('UPDATE kb_articles SET views=views+1 WHERE id=?'),
  voteKbArticle: db.prepare('UPDATE kb_articles SET helpful=helpful+?,not_helpful=not_helpful+? WHERE id=?'),
  deleteKbArticle: db.prepare('DELETE FROM kb_articles WHERE id=?'),

  // Notifications
  getNotificationsByUser: db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50'),
  getUnreadCount: db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND read=0'),
  createNotification: db.prepare('INSERT INTO notifications (id,user_id,type,title,text,chat_id,ticket_id) VALUES (?,?,?,?,?,?,?)'),
  markNotificationRead: db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?'),
  markAllNotificationsRead: db.prepare('UPDATE notifications SET read=1 WHERE user_id=?'),

  // Quick replies
  getAllQuickReplies: db.prepare('SELECT * FROM quick_replies ORDER BY title'),
  createQuickReply: db.prepare('INSERT INTO quick_replies (id,title,text,category,created_by) VALUES (?,?,?,?,?)'),
  updateQuickReply: db.prepare('UPDATE quick_replies SET title=?,text=?,category=? WHERE id=?'),
  deleteQuickReply: db.prepare('DELETE FROM quick_replies WHERE id=?'),

  // Audit log
  createAuditLog: db.prepare('INSERT INTO audit_log (id,user_id,action,entity_type,entity_id,details,ip_address) VALUES (?,?,?,?,?,?,?)'),
  getAuditLog: db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200'),

  // Settings
  getSetting: db.prepare('SELECT value FROM settings WHERE key=?'),
  setSetting: db.prepare('INSERT OR REPLACE INTO settings (key,value,updated_at) VALUES (?,?,datetime(\'now\'))'),
  getAllSettings: db.prepare('SELECT * FROM settings'),
};

module.exports = { db, helpers };
