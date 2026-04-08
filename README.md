# IMARAT IT Support Portal

A full-stack enterprise IT support portal with live chat, ticketing, knowledge base, analytics, and AI-powered assistance.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Custom CSS (no Tailwind runtime)
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT (localStorage + httpOnly cookie)
- **Realtime**: Polling (WebSocket-ready via socket.io)
- **AI**: Anthropic Claude API (configurable)

## Features
- **Multi-role portal**: User, Agent, Manager/Admin views
- **Live Chat**: Real-time chat with queue management, internal notes, quick replies, AI suggestions
- **Ticket System**: Full CRUD with SLA tracking, priority management, comments
- **Knowledge Base**: Markdown articles, search, helpful votes
- **Analytics**: KPIs, agent performance, SLA compliance, charts
- **User Management**: CRUD with role-based access control
- **Notifications**: Real-time notifications with bell icon
- **Settings**: Company info, chat routing, SLA policy, quick replies, AI config

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Copy `.env.local` and fill in your values:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/imarat_it_support"
JWT_SECRET="your-secret-key-change-in-production"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 4. Set up database
```bash
npx prisma generate
npx prisma db push
```

### 5. Seed database
```bash
npm run seed
```

### 6. Run development server
```bash
npm run dev
```

## Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Manager/Admin | aleeraza665@gmail.com | Securesocketshell@22 |
| IT Agent | sarah.chen@imarat.com | Agent@2024! |
| End User | tom.bradley@imarat.com | User@2024! |

## Project Structure
```
├── app/
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── chats/          # Live chat module
│   │   ├── tickets/        # Ticket management
│   │   ├── knowledge/      # Knowledge base
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── users/          # User management
│   │   ├── settings/       # System settings
│   │   └── notifications/  # Notification center
│   ├── api/                # REST API routes
│   └── login/              # Login page
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── chat/               # ChatWindow component
│   └── layout/             # Sidebar, Header
├── contexts/               # React contexts (Auth)
├── hooks/                  # Custom hooks (useAPI, usePolling)
├── lib/                    # Server utilities (db, auth, seed)
├── prisma/                 # Database schema
└── types/                  # TypeScript types
```

## Deployment (Vercel)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

For database, use Neon (serverless PostgreSQL) or Supabase.
