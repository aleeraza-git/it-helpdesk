/**
 * IMARAT IT Support - Seed Script
 * Run: node server/seed.js
 * Populates the database with default admin, agents, users, and sample data.
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db, helpers } = require('./database');

console.log('Seeding IMARAT IT Support database...');

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
const users = [
  { id: 'u1', name: 'Ali Raza', email: 'aleeraza665@gmail.com', password: 'Securesocketshell@22', role: 'manager', department: 'IT Management', avatar: 'AR', skills: [] },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah.chen@imarat.com', password: 'Agent@12345', role: 'agent', department: 'IT Helpdesk', avatar: 'SC', skills: ['hardware','network','software','vpn'] },
  { id: 'u3', name: 'James Okafor', email: 'james.o@imarat.com', password: 'Agent@12345', role: 'agent', department: 'IT Helpdesk', avatar: 'JO', skills: ['software','email','o365','windows'] },
  { id: 'u4', name: 'Priya Nair', email: 'priya.n@imarat.com', password: 'Agent@12345', role: 'agent', department: 'IT Helpdesk', avatar: 'PN', skills: ['hardware','printer','network','linux'] },
  { id: 'u5', name: 'Tom Bradley', email: 'tom.b@imarat.com', password: 'User@12345', role: 'user', department: 'Finance', avatar: 'TB', skills: [] },
  { id: 'u6', name: 'Maya Singh', email: 'maya.s@imarat.com', password: 'User@12345', role: 'user', department: 'Marketing', avatar: 'MS', skills: [] },
  { id: 'u7', name: 'David Kim', email: 'david.k@imarat.com', password: 'User@12345', role: 'user', department: 'Engineering', avatar: 'DK', skills: [] },
];

const insertUsers = db.transaction(() => {
  for (const u of users) {
    const existing = helpers.getUserByEmail.get(u.email);
    if (!existing) {
      const hash = bcrypt.hashSync(u.password, 12);
      helpers.createUser.run(u.id, u.name, u.email, hash, u.role, u.department, u.avatar, JSON.stringify(u.skills));
      db.prepare('UPDATE users SET status=?, current_chats=?, max_chats=? WHERE id=?').run(
        u.role === 'agent' ? 'online' : u.role === 'manager' ? 'online' : 'offline',
        u.role === 'agent' ? Math.floor(Math.random() * 3) : 0,
        5, u.id
      );
      console.log(`  Created user: ${u.name} (${u.role})`);
    }
  }
});
insertUsers();

// ─────────────────────────────────────────────
// QUICK REPLIES
// ─────────────────────────────────────────────
const quickReplies = [
  { id: 'qr1', title: 'Greeting', text: 'Hello! Thank you for contacting IMARAT IT Support. I am here to help you today. Could you please describe the issue you are experiencing in detail?', category: 'general' },
  { id: 'qr2', title: 'Gather Device Info', text: 'To help diagnose the issue effectively, could you please provide the following information:\n1. Your device name and model\n2. Operating system and version\n3. The exact error message you are seeing', category: 'general' },
  { id: 'qr3', title: 'Remote Session Offer', text: 'I would like to remotely connect to your device to investigate this further. Would that be acceptable? I will send you a secure connection link shortly.', category: 'general' },
  { id: 'qr4', title: 'Resolution Check', text: 'I believe the issue should now be resolved. Could you please verify that everything is working correctly on your end and let me know?', category: 'general' },
  { id: 'qr5', title: 'Closing', text: 'I am glad I could help resolve your issue today! Is there anything else I can assist you with? If this issue recurs, please do not hesitate to reach out to us again.', category: 'general' },
  { id: 'qr6', title: 'Password Reset', text: 'You can reset your password through our self-service portal at https://sspr.imarat.com. You will need to verify your identity via MFA. Would you like me to walk you through the steps?', category: 'security' },
  { id: 'qr7', title: 'Escalating Issue', text: 'This issue requires specialist attention. I am escalating your case to our senior technical team. You will receive an update within 2 business hours. Your ticket reference is being created now.', category: 'general' },
  { id: 'qr8', title: 'VPN Troubleshoot', text: 'For VPN connectivity issues, please try the following steps:\n1. Ensure you are using IMARAT\\\\username format (not just your username)\n2. Confirm your MFA device is registered\n3. Try disconnecting and reconnecting\nLet me know if the issue persists.', category: 'network' },
  { id: 'qr9', title: 'Awaiting Response', text: 'I am still here to assist you. Please take your time and let me know when you are ready to continue troubleshooting.', category: 'general' },
  { id: 'qr10', title: 'Scheduled Maintenance', text: 'Please note that the system will be undergoing scheduled maintenance. This may be causing the issue you are experiencing. Normal service will resume shortly. Apologies for any inconvenience.', category: 'general' },
];

const insertQR = db.transaction(() => {
  for (const qr of quickReplies) {
    const existing = db.prepare('SELECT id FROM quick_replies WHERE id=?').get(qr.id);
    if (!existing) {
      helpers.createQuickReply.run(qr.id, qr.title, qr.text, qr.category, 'u1');
    }
  }
});
insertQR();
console.log('  Quick replies seeded');

// ─────────────────────────────────────────────
// KNOWLEDGE BASE ARTICLES
// ─────────────────────────────────────────────
const kbArticles = [
  {
    id: 'kb1', title: 'How to Connect to Company VPN', slug: 'how-to-connect-vpn',
    category: 'Network', tags: ['vpn','remote','network','cisco'],
    content: `## Overview
This guide walks you through connecting to the IMARAT company VPN using Cisco AnyConnect.

## Prerequisites
- Cisco AnyConnect VPN client installed (contact IT if not installed)
- Active company credentials
- Registered MFA device (Microsoft Authenticator)
- Internet connection

## Connection Steps

**Step 1:** Open Cisco AnyConnect from your system tray or applications menu.

**Step 2:** Enter the VPN gateway address: vpn.imarat.com

**Step 3:** Click Connect.

**Step 4:** When prompted for username, enter in the format: IMARAT\\\\your.name (e.g., IMARAT\\\\tom.bradley)

**Step 5:** Enter your Active Directory password.

**Step 6:** Accept the MFA push notification on your registered device.

## Common Error Codes

**Error 691 - Authentication Failed**
Verify your username includes the IMARAT\\\\ prefix. Your password may have expired - use the SSPR portal to reset it.

**Error 442 - VPN Client Version Mismatch**
Update the VPN client through Software Center.

**Error 404 - Gateway Not Found**
Check your internet connection. Ensure vpn.imarat.com is the correct gateway address.

**Connection Drops Frequently**
This may indicate MTU issues. Contact IT Helpdesk for advanced configuration.

## Still Having Issues?
Contact the IT Helpdesk via live chat or raise a ticket with priority 'High'.`,
    published: 1, featured: 1
  },
  {
    id: 'kb2', title: 'Setting Up Email Signature in Outlook', slug: 'email-signature-outlook',
    category: 'Software', tags: ['outlook','email','signature','o365'],
    content: `## Overview
Configure a professional email signature in Microsoft Outlook using the company-approved template.

## Desktop Application (Outlook 2019/2021/365)

**Step 1:** Open Outlook and navigate to File > Options > Mail.

**Step 2:** Click the Signatures button.

**Step 3:** Click New and name your signature (e.g., "IMARAT Standard").

**Step 4:** Download the company signature template from the IT Portal or use the HTML template located at \\\\\\\\fileserver\\\\templates\\\\email-signature.html.

**Step 5:** Paste the template content into the signature editor.

**Step 6:** Replace the placeholder text with your name, title, and phone number.

**Step 7:** Set your signature as the default for New Messages and Replies.

## Outlook Web App (OWA)

**Step 1:** Click the gear icon in the top right corner.

**Step 2:** Select View all Outlook settings.

**Step 3:** Navigate to Mail > Compose and reply.

**Step 4:** Paste your HTML signature in the Email signature field.

**Step 5:** Check "Automatically include my signature on new messages".

## Troubleshooting

**Signature appears as attachment:**
Ensure all images in your signature are hosted externally rather than embedded as Base64. Use the standard template which uses linked images.

**Signature disappears after update:**
Re-configure your signature after major Outlook updates. This is a known Microsoft issue.

**HTML formatting looks broken:**
Copy the signature from the official template file rather than creating it from scratch.`,
    published: 1, featured: 0
  },
  {
    id: 'kb3', title: 'Resetting Your Active Directory Password', slug: 'reset-ad-password',
    category: 'Security', tags: ['password','active-directory','security','sspr'],
    content: `## Overview
Instructions for resetting your IMARAT Active Directory password through the self-service portal.

## Method 1: Self-Service Password Reset Portal (Recommended)

**Step 1:** Visit https://sspr.imarat.com from any browser.

**Step 2:** Enter your company username or email address.

**Step 3:** Complete the MFA verification (Microsoft Authenticator push or SMS code).

**Step 4:** Enter and confirm your new password.

**Step 5:** Sign in to your workstation with the new password within 15 minutes to update cached credentials.

## Password Policy Requirements

Your new password must meet these requirements:
- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)
- Cannot contain your username or display name
- Cannot reuse any of your last 10 passwords
- Expires every 90 days

## Method 2: IT Helpdesk Reset

If self-service fails:
1. Contact IT Helpdesk via live chat or call extension 4357
2. You will be required to verify your identity with your employee ID and date of birth
3. A temporary password will be issued valid for 24 hours
4. You must change it on first login

## After Password Reset

- Update saved passwords in browsers and mobile devices
- Re-authenticate VPN client with new password
- Update email client credentials if prompted
- Mobile device Exchange/OWA may require re-configuration`,
    published: 1, featured: 1
  },
  {
    id: 'kb4', title: 'Hardware and Software Procurement Request Process', slug: 'procurement-request',
    category: 'Procurement', tags: ['hardware','software','procurement','request','order'],
    content: `## Overview
All hardware and software requests must follow the IMARAT IT procurement process to ensure security compliance and budget approval.

## Step 1: Check the Approved Catalog

Visit the IT Portal and browse the pre-approved hardware and software catalog. Items on this list have already been security-vetted and can be ordered within 3-5 business days.

## Step 2: Submit a Procurement Request

**For catalog items:**
1. Open a new ticket with category "Procurement"
2. Select the item from the dropdown
3. Provide your business justification (required for items over £500)
4. Submit - your manager will receive an automated approval request

**For non-catalog items:**
1. Open a ticket with category "Procurement - Non-Standard"
2. Include full product specifications and the vendor link
3. Provide a detailed business justification
4. Attach your line manager's email approval
5. Non-standard requests require IT Security review

## Approval and Delivery Timelines

| Item Type | Approval Time | Delivery Time |
|-----------|--------------|---------------|
| Catalog items under £500 | Automatic | 3-5 days |
| Catalog items over £500 | Manager approval (1 day) | 5-7 days |
| Non-standard items | IT Committee review (5-7 days) | 2-4 weeks |
| Emergency requests | Director approval (same day) | 1-3 days |

## Emergency Requests

For business-critical equipment failures, please call the IT Helpdesk directly on extension 4357. Emergency procurement requires Director-level sign-off and additional justification.`,
    published: 1, featured: 0
  },
  {
    id: 'kb5', title: 'Multi-Factor Authentication (MFA) Setup Guide', slug: 'mfa-setup-guide',
    category: 'Security', tags: ['mfa','security','2fa','authenticator','microsoft'],
    content: `## Overview
MFA is mandatory for all IMARAT company accounts. We use Microsoft Authenticator as the primary method.

## Initial MFA Registration

**Step 1:** Download Microsoft Authenticator from the App Store (iOS) or Google Play (Android).

**Step 2:** On your computer, visit https://aka.ms/mysecurityinfo and sign in with your company account.

**Step 3:** Click Add method and select Authenticator app.

**Step 4:** Click Next and follow the on-screen instructions to scan the QR code with your phone.

**Step 5:** Enter the 6-digit code displayed in the app to verify setup.

**Step 6:** Set Microsoft Authenticator as your default sign-in method.

## Registering a New or Replacement Phone

**Important:** Register your new device BEFORE removing your old device from the account.

1. Visit https://aka.ms/mysecurityinfo on your computer
2. Sign in with your current MFA method (use old phone if available)
3. Click Add method and register the new phone
4. Once confirmed, remove the old device

## Lost or Stolen Phone

Contact IT Helpdesk immediately on extension 4357 for an emergency bypass code. Your account will be temporarily secured pending device replacement.

## Backup Authentication Methods

You should register at least two MFA methods:
- Microsoft Authenticator (primary)
- Personal phone number for SMS backup
- Hardware FIDO2 key (available on request for privileged accounts)

## MFA Fatigue Protection

Never approve an MFA request you did not initiate. If you receive unexpected MFA prompts, reject them and contact IT Security immediately - this may indicate a phishing attempt.`,
    published: 1, featured: 1
  },
  {
    id: 'kb6', title: 'Setting Up Remote Desktop Access', slug: 'remote-desktop-setup',
    category: 'Network', tags: ['rdp','remote-desktop','remote-access','wfh'],
    content: `## Overview
Accessing your office workstation remotely using Windows Remote Desktop Protocol (RDP).

## Prerequisites
- Active VPN connection (see VPN guide)
- Remote Desktop enabled on your office workstation (IT can enable this for you)
- Your office workstation must be powered on

## Connecting via Remote Desktop

**Windows:**
1. Connect to VPN first
2. Press Win+R and type mstsc, then press Enter
3. Enter your workstation hostname (e.g., WS-FIN-001) or IP address
4. Click Connect
5. Enter your IMARAT credentials when prompted

**macOS:**
1. Install Microsoft Remote Desktop from the App Store
2. Connect to VPN first
3. Add a new PC with your workstation hostname
4. Connect and authenticate with your IMARAT credentials

## Finding Your Workstation Name

Your workstation name is printed on a label on the front of your computer. It follows the format WS-[DEPT]-[NUMBER]. You can also find it in the IT Portal under My Devices.

## Performance Tips

- For best performance, set display settings to 1920x1080 or lower
- Disable remote audio playback if experiencing lag
- Close unused applications on the remote machine`,
    published: 1, featured: 0
  },
];

const insertKB = db.transaction(() => {
  for (const a of kbArticles) {
    const existing = db.prepare('SELECT id FROM kb_articles WHERE id=?').get(a.id);
    if (!existing) {
      helpers.createKbArticle.run(a.id, a.title, a.slug, a.content, a.category, JSON.stringify(a.tags), 'u2', a.published);
      db.prepare('UPDATE kb_articles SET views=?,helpful=?,featured=? WHERE id=?').run(
        Math.floor(Math.random() * 500) + 50,
        Math.floor(Math.random() * 40) + 5,
        a.featured,
        a.id
      );
    }
  }
});
insertKB();
console.log('  Knowledge base articles seeded');

// ─────────────────────────────────────────────
// SAMPLE CHATS AND MESSAGES
// ─────────────────────────────────────────────
const insertChats = db.transaction(() => {
  const c1 = db.prepare('SELECT id FROM chats WHERE id=?').get('c1');
  if (!c1) {
    helpers.createChat.run('c1', 'u5', 'u2', 'active', 'high', 'VPN not connecting from home office', 'network', JSON.stringify(['vpn','remote-work']), null);
    const msgs1 = [
      { id: 'm1', sender: 'u5', text: 'I cannot connect to the VPN from my home office. I keep getting error code 691 and it fails immediately after entering my password.', type: 'text' },
      { id: 'm2', sender: 'u2', text: 'Hello Tom, I am Sarah from IT Support. I can help you with that. Error 691 usually indicates an authentication issue. Could you confirm the username format you are using? It should be IMARAT\\\\tom.bradley (including the domain prefix).', type: 'text' },
      { id: 'm3', sender: 'u5', text: 'I was using just my email address. Let me try with the IMARAT\\\\ prefix.', type: 'text' },
      { id: 'm4', sender: 'u2', text: 'Yes, please use IMARAT\\\\tom.bradley as the username, and your normal Windows password. Also make sure your Microsoft Authenticator app is open and ready for the MFA prompt.', type: 'text' },
      { id: 'm5', sender: 'u5', text: 'Still getting the same error. The MFA prompt is not appearing at all.', type: 'text' },
    ];
    for (const m of msgs1) {
      helpers.createMessage.run(genId(), 'c1', m.sender, m.type, m.text, null, null, null, null);
    }
    helpers.createNote.run(genId(), 'c1', 'u2', 'User account checked in AD - no lockout. MFA registration may have lapsed. Need to verify authenticator registration at https://aka.ms/mysecurityinfo');

    helpers.createChat.run('c2', 'u6', 'u3', 'active', 'medium', 'Email signature showing as attachment in Outlook', 'software', JSON.stringify(['outlook','email']), null);
    const msgs2 = [
      { id: 'a', sender: 'u6', text: 'My email signature is appearing as an attachment for recipients instead of displaying in the email body. Several colleagues have complained about this.', type: 'text' },
      { id: 'b', sender: 'u3', text: 'Hello Maya! This is James from IT Support. This is a known issue with HTML signatures containing embedded images. Are you using Outlook Desktop or the Web App (OWA)?', type: 'text' },
      { id: 'c', sender: 'u6', text: 'I am using Outlook 2021 on my company laptop.', type: 'text' },
    ];
    for (const m of msgs2) {
      helpers.createMessage.run(genId(), 'c2', m.sender, 'text', m.text, null, null, null, null);
    }

    helpers.createChat.run('c3', 'u5', null, 'queued', 'low', 'Request for second monitor for workstation', 'hardware', JSON.stringify(['hardware','equipment']), 1);
    helpers.createMessage.run(genId(), 'c3', 'u5', 'text', 'I would like to request a second monitor for my workstation to improve productivity when working with multiple spreadsheets simultaneously.', null, null, null, null);

    helpers.createChat.run('c4', 'u7', 'u4', 'resolved', 'medium', 'Printer not found on Engineering floor', 'hardware', JSON.stringify(['printer','hardware']), null);
    const msgs4 = [
      { sender: 'u7', text: 'The HP LaserJet on floor 4 is not showing up in my print dialog. Other printers are visible but not this one.' },
      { sender: 'u4', text: 'Hello David, I am Priya from IT Support. I will look into this for you. Can you tell me your workstation name? It should be on a label on your computer.' },
      { sender: 'u7', text: 'The workstation name is WS-ENG-042.' },
      { sender: 'u4', text: 'I can see the issue - the printer driver was not deployed to your workstation. I am pushing it via Group Policy now. Please restart your computer and the printer should appear.' },
      { sender: 'u7', text: 'It is working now. Thank you for the quick fix!' },
      { sender: 'u4', text: 'You are welcome! I am glad we got it sorted. I have also deployed the driver to all Engineering workstations to prevent this from recurring. Have a great day!' },
    ];
    for (const m of msgs4) {
      helpers.createMessage.run(genId(), 'c4', m.sender, 'text', m.text, null, null, null, null);
    }
    db.prepare('UPDATE chats SET status=\'resolved\',resolution=\'Printer driver deployed via Group Policy\',resolved_at=datetime(\'now\',\'-1 day\'),rating=5 WHERE id=\'c4\'').run();
  }
});
insertChats();
console.log('  Sample chats and messages seeded');

// ─────────────────────────────────────────────
// SAMPLE TICKETS
// ─────────────────────────────────────────────
const insertTickets = db.transaction(() => {
  const t1 = db.prepare('SELECT id FROM tickets WHERE ticket_number=?').get('IIM-0001');
  if (!t1) {
    const tickets = [
      {
        id: 't1', num: 'IIM-0001', chatId: 'c1', userId: 'u5', agentId: 'u2',
        status: 'in_progress', priority: 'high', subject: 'VPN not connecting from home office',
        description: 'User unable to connect to VPN from home. Error 691 persists after domain prefix correction. MFA prompt not appearing. Suspect MFA registration issue.',
        category: 'network', slaR: 1, slaRes: 4, breached: 0,
        comments: [
          { userId: 'u2', text: 'Checking MFA registration status in Azure AD.', internal: 1 },
          { userId: 'u2', text: 'Hi Tom, I have checked your MFA registration. It appears your Authenticator app registration expired. Please follow the steps in our MFA Setup Guide to re-register: https://support.imarat.com/kb/mfa-setup-guide', internal: 0 },
        ]
      },
      {
        id: 't2', num: 'IIM-0002', chatId: null, userId: 'u6', agentId: 'u2',
        status: 'open', priority: 'medium', subject: 'Office 365 license not assigned after role promotion',
        description: 'Maya Singh was promoted to Senior Marketing Manager last week. The IT change request was submitted (CHG-2024-089) but the O365 E3 license has not been assigned. She currently has E1 and cannot access advanced features.',
        category: 'software', slaR: 2, slaRes: 8, breached: 1,
        comments: []
      },
      {
        id: 't3', num: 'IIM-0003', chatId: 'c4', userId: 'u7', agentId: 'u4',
        status: 'resolved', priority: 'low', subject: 'HP LaserJet printer not visible on Engineering floor',
        description: 'HP LaserJet Pro M404dn on floor 4 not appearing in print dialog for Engineering workstations.',
        category: 'hardware', slaR: 4, slaRes: 24, breached: 0,
        comments: [
          { userId: 'u4', text: 'Printer driver missing from WS-ENG-042 and several other Engineering workstations. Deploying via Group Policy.', internal: 1 },
          { userId: 'u4', text: 'Printer driver successfully deployed via Group Policy to all Engineering workstations (14 machines). Issue resolved.', internal: 0 },
        ],
        resolution: 'HP LaserJet driver deployed via Group Policy Object to all Engineering floor workstations.'
      },
      {
        id: 't4', num: 'IIM-0004', chatId: null, userId: 'u5', agentId: 'u3',
        status: 'open', priority: 'critical', subject: 'Finance application database connection failure',
        description: 'The SAP Finance module is throwing database connection errors for the entire Finance team since 09:00 this morning. Impact: Cannot process invoices or run payroll reports. Affects 12 users.',
        category: 'software', slaR: 0.5, slaRes: 2, breached: 1,
        comments: [
          { userId: 'u3', text: 'Escalating to DBA team. Checking database server connectivity.', internal: 1 },
          { userId: 'u3', text: 'Our database team is investigating the root cause. We expect an update within 30 minutes. Apologies for the disruption.', internal: 0 },
        ]
      },
    ];

    for (const t of tickets) {
      const due = new Date(Date.now() + 48 * 3600000).toISOString();
      helpers.createTicket.run(t.id, t.num, t.chatId, t.userId, t.agentId, t.status, t.priority, t.subject, t.description, t.category, '[]', due, t.slaR, t.slaRes);
      if (t.breached) db.prepare('UPDATE tickets SET sla_breached=1 WHERE id=?').run(t.id);
      if (t.resolution) db.prepare('UPDATE tickets SET resolution=?,resolved_at=datetime(\'now\',\'-1 day\') WHERE id=?').run(t.resolution, t.id);
      for (const c of (t.comments || [])) {
        helpers.createTicketComment.run(genId(), t.id, c.userId, c.text, c.internal);
      }
    }
  }
});
insertTickets();
console.log('  Sample tickets seeded');

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
const insertNotifs = db.transaction(() => {
  const existing = db.prepare('SELECT COUNT(*) as c FROM notifications').get();
  if (existing.c === 0) {
    const notifs = [
      { id: genId(), userId: 'u5', type: 'chat_reply', title: 'Agent replied to your chat', text: 'Sarah Chen replied to your VPN support chat.', chatId: 'c1', ticketId: null },
      { id: genId(), userId: 'u5', type: 'ticket_update', title: 'Ticket IIM-0001 updated', text: 'Your VPN ticket has been updated with new information.', chatId: null, ticketId: 't1' },
      { id: genId(), userId: 'u2', type: 'new_chat', title: 'New chat assigned to you', text: 'A new high-priority chat from Tom Bradley has been assigned.', chatId: 'c1', ticketId: null },
      { id: genId(), userId: 'u2', type: 'new_message', title: 'New message from Tom Bradley', text: 'Tom replied in the VPN support chat.', chatId: 'c1', ticketId: null },
      { id: genId(), userId: 'u1', type: 'sla_breach', title: 'SLA breach alert', text: 'Ticket IIM-0002 has breached the SLA response time target.', chatId: null, ticketId: 't2' },
      { id: genId(), userId: 'u1', type: 'sla_breach', title: 'Critical ticket SLA breach', text: 'Critical ticket IIM-0004 has breached the 30-minute response SLA.', chatId: null, ticketId: 't4' },
    ];
    for (const n of notifs) {
      helpers.createNotification.run(n.id, n.userId, n.type, n.title, n.text, n.chatId, n.ticketId);
    }
  }
});
insertNotifs();
console.log('  Notifications seeded');

// ─────────────────────────────────────────────
// DEFAULT SETTINGS
// ─────────────────────────────────────────────
const defaultSettings = {
  'company.name': 'IMARAT',
  'company.domain': 'imarat.com',
  'company.timezone': 'UTC',
  'chat.auto_assign': 'true',
  'chat.routing_strategy': 'round-robin',
  'chat.max_queue_size': '50',
  'chat.idle_timeout': '300',
  'chat.max_concurrent': '5',
  'notifications.email_alerts': 'true',
  'notifications.browser': 'true',
  'sla.low.response': '4',
  'sla.low.resolution': '24',
  'sla.medium.response': '2',
  'sla.medium.resolution': '8',
  'sla.high.response': '1',
  'sla.high.resolution': '4',
  'sla.critical.response': '0.5',
  'sla.critical.resolution': '2',
};
const insertSettings = db.transaction(() => {
  for (const [key, value] of Object.entries(defaultSettings)) {
    helpers.setSetting.run(key, value);
  }
});
insertSettings();
console.log('  Settings seeded');

function genId() { return require('uuid').v4(); }

console.log('\nSeed complete. Default credentials:');
console.log('  Admin:  aleeraza665@gmail.com / Securesocketshell@22');
console.log('  Agent:  sarah.chen@imarat.com / Agent@12345');
console.log('  User:   tom.b@imarat.com / User@12345');
