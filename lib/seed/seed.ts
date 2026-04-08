// lib/seed/seed.ts - Database seeder
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedUsers, seedKBArticles, seedQuickReplies, seedSystemSettings } from './data'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding IMARAT IT Support database...')

  // Clear existing data (dev only)
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.internalNote.deleteMany()
  await prisma.message.deleteMany()
  await prisma.ticketComment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.chat.deleteMany()
  await prisma.kBArticle.deleteMany()
  await prisma.quickReply.deleteMany()
  await prisma.systemSettings.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const createdUsers: Record<string, any> = {}
  for (const userData of seedUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    const user = await prisma.user.create({
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role as any,
        department: userData.department,
        skills: userData.skills,
        maxChats: userData.maxChats,
        status: userData.status as any,
        avatar: userData.avatar,
      },
    })
    createdUsers[userData.id] = user
    console.log(`Created user: ${user.name} (${user.role})`)
  }

  // Create chats with messages
  const chat1 = await prisma.chat.create({
    data: {
      subject: 'VPN not connecting from home office',
      status: 'ACTIVE',
      priority: 'HIGH',
      category: 'network',
      tags: ['vpn', 'remote-work'],
      userId: 'usr_user_001',
      agentId: 'usr_agent_001',
      messages: {
        create: [
          {
            text: 'I cannot connect to the company VPN from my home office. I keep getting error code 691.',
            senderId: 'usr_user_001',
            type: 'TEXT',
            isRead: true,
          },
          {
            text: 'Hello Tom, I can help with that. Error 691 indicates an authentication issue. Your username must include the domain prefix. Please try IMARAT\\\\tom.bradley instead of just your username.',
            senderId: 'usr_agent_001',
            type: 'TEXT',
            isRead: true,
          },
          {
            text: 'I tried with the IMARAT\\\\ prefix but still getting the same error. Here is the exact error: Authentication failed due to problem with credentials.',
            senderId: 'usr_user_001',
            type: 'TEXT',
            isRead: false,
          },
        ],
      },
      internalNotes: {
        create: [
          {
            text: 'User confirmed correct VPN client version 4.10.x. Issue may be account lockout in AD - checking with network team.',
            agentId: 'usr_agent_001',
          },
        ],
      },
    },
  })

  const chat2 = await prisma.chat.create({
    data: {
      subject: 'Outlook email signature appearing as attachment',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      category: 'software',
      tags: ['outlook', 'email'],
      userId: 'usr_user_002',
      agentId: 'usr_agent_002',
      messages: {
        create: [
          {
            text: 'My email signature is showing as an attachment for recipients instead of appearing inline in the email body. This started after the Office update last week.',
            senderId: 'usr_user_002',
            type: 'TEXT',
            isRead: true,
          },
          {
            text: 'Hello Maya, this is a known issue with some HTML signatures after the recent Office 365 update. Are you using Outlook Desktop or Outlook Web App?',
            senderId: 'usr_agent_002',
            type: 'TEXT',
            isRead: true,
          },
          {
            text: 'I use both actually - the desktop Outlook 2021 on my laptop and OWA on my phone.',
            senderId: 'usr_user_002',
            type: 'TEXT',
            isRead: false,
          },
        ],
      },
      internalNotes: { create: [] },
    },
  })

  const chat3 = await prisma.chat.create({
    data: {
      subject: 'Request for additional monitor for workstation',
      status: 'QUEUED',
      priority: 'LOW',
      category: 'hardware',
      tags: ['hardware', 'monitor', 'procurement'],
      queuePosition: 1,
      userId: 'usr_user_001',
      agentId: null,
      messages: {
        create: [
          {
            text: 'Hi, I would like to request a second 27-inch monitor for my workstation. Working on financial models requires more screen space and it would significantly improve my productivity.',
            senderId: 'usr_user_001',
            type: 'TEXT',
            isRead: true,
          },
        ],
      },
      internalNotes: { create: [] },
    },
  })

  // Create tickets
  await prisma.ticket.create({
    data: {
      subject: 'VPN not connecting from home office',
      description: 'User unable to connect to corporate VPN from home. Error 691 persists even after correcting domain prefix. Network team investigation required.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'network',
      tags: ['vpn', 'remote-work'],
      userId: 'usr_user_001',
      agentId: 'usr_agent_001',
      chatId: chat1.id,
      dueDate: new Date(Date.now() + 86400000 * 2),
      slaBreached: false,
      slaResponse: 1,
      slaResolution: 4,
      comments: {
        create: [
          {
            text: 'Confirmed user has correct VPN client. Checked AD - account is not locked. Escalating to network team for firewall investigation.',
            userId: 'usr_agent_001',
            isInternal: true,
          },
          {
            text: 'We are investigating a possible firewall rule conflict affecting users in your subnet. Our network team is working on this and expects to have a resolution within 2 hours.',
            userId: 'usr_agent_001',
            isInternal: false,
          },
        ],
      },
    },
  })

  await prisma.ticket.create({
    data: {
      subject: 'Microsoft 365 E3 license not assigned after role promotion',
      description: 'Employee was promoted to Senior Analyst. Manager submitted license upgrade request 5 days ago but M365 E3 license still pending. User cannot access advanced features.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'software',
      tags: ['microsoft365', 'licensing'],
      userId: 'usr_user_002',
      agentId: 'usr_agent_001',
      dueDate: new Date(Date.now() + 86400000),
      slaBreached: true,
      slaResponse: 1,
      slaResolution: 8,
      comments: {
        create: [
          {
            text: 'Awaiting license pool confirmation from procurement. Expected resolution by end of day.',
            userId: 'usr_agent_001',
            isInternal: true,
          },
        ],
      },
    },
  })

  await prisma.ticket.create({
    data: {
      subject: 'HP LaserJet not detected on Finance floor (3rd floor)',
      description: 'Finance department on 3rd floor unable to print. HP LaserJet Pro (10.1.4.50) not appearing in print dialog on any workstation. Issue affects entire department.',
      status: 'RESOLVED',
      priority: 'HIGH',
      category: 'hardware',
      tags: ['printer', 'hardware', 'network-printer'],
      userId: 'usr_user_001',
      agentId: 'usr_agent_003',
      dueDate: new Date(Date.now() - 86400000),
      slaBreached: false,
      slaResponse: 0.5,
      slaResolution: 2,
      resolution: 'Printer driver was removed during the OS update last Tuesday. Deployed updated HP Universal Print Driver (v7.1.0) via Group Policy to all 3rd floor workstations. Tested and confirmed working on all 12 workstations.',
      resolvedAt: new Date(Date.now() - 172800000),
      comments: {
        create: [
          {
            text: 'Issue traced to OS update last Tuesday which removed the HP Universal Print Driver. Deploying via GPO now.',
            userId: 'usr_agent_003',
            isInternal: true,
          },
          {
            text: 'HP Universal Print Driver v7.1.0 successfully deployed to all 12 Finance workstations. Printer is now accessible and all test prints successful. Please confirm on your end.',
            userId: 'usr_agent_003',
            isInternal: false,
          },
        ],
      },
    },
  })

  await prisma.ticket.create({
    data: {
      subject: 'BitLocker recovery key needed - locked out of laptop',
      description: 'User accidentally triggered BitLocker lockout after BIOS update. Needs recovery key to regain access to their device.',
      status: 'OPEN',
      priority: 'CRITICAL',
      category: 'security',
      tags: ['bitlocker', 'security', 'encryption'],
      userId: 'usr_user_003',
      agentId: null,
      dueDate: new Date(Date.now() + 3600000 * 2),
      slaBreached: false,
      slaResponse: 0.5,
      slaResolution: 2,
      comments: { create: [] },
    },
  })

  // Create KB articles
  for (const article of seedKBArticles) {
    await prisma.kBArticle.create({
      data: {
        title: article.title,
        category: article.category,
        tags: article.tags,
        content: article.content,
        views: article.views,
        helpful: article.helpful,
        published: article.published,
        authorId: 'usr_agent_001',
      },
    })
  }
  console.log(`Created ${seedKBArticles.length} KB articles`)

  // Create quick replies
  for (const qr of seedQuickReplies) {
    await prisma.quickReply.create({ data: qr })
  }
  console.log(`Created ${seedQuickReplies.length} quick replies`)

  // Create system settings
  for (const setting of seedSystemSettings) {
    await prisma.systemSettings.create({ data: setting })
  }
  console.log('Created system settings')

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { userId: 'usr_user_001', type: 'NEW_MESSAGE', title: 'Agent replied', text: 'Ali Raza replied to your VPN support chat.', chatId: chat1.id },
      { userId: 'usr_user_001', type: 'TICKET_UPDATED', title: 'Ticket updated', text: 'Your VPN ticket has been updated with new information.' },
      { userId: 'usr_agent_001', type: 'NEW_CHAT', title: 'New chat assigned', text: 'A new chat has been assigned to you from Tom Bradley.' },
      { userId: 'usr_agent_002', type: 'NEW_CHAT', title: 'New chat assigned', text: 'New chat from Maya Singh about Outlook signature issue.' },
      { userId: 'usr_agent_001', type: 'TICKET_CREATED', title: 'Critical ticket created', text: 'CRITICAL: BitLocker lockout reported by David Park. Immediate attention required.' },
      { userId: 'usr_user_002', type: 'CHAT_ASSIGNED', title: 'Agent assigned', text: 'James Okafor has been assigned to your chat and will assist you shortly.' },
    ],
  })

  console.log('Seeding complete!')
  console.log('\n=== Login Credentials ===')
  console.log('Manager/Admin: aleeraza665@gmail.com / Securesocketshell@22')
  console.log('Agent: sarah.chen@imarat.com / Agent@2024!')
  console.log('User: tom.bradley@imarat.com / User@2024!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
