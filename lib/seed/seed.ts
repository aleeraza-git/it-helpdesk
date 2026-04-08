import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding IMARAT IT Support database...")

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

  const hashedPassword = await bcrypt.hash("Securesocketshell@22", 12)
  await prisma.user.create({
    data: {
      id: "usr_admin_001",
      name: "Ali Raza",
      email: "aleeraza665@gmail.com",
      password: hashedPassword,
      role: "MANAGER",
      department: "IT Management",
      skills: ["management", "network", "security"],
      maxChats: 10,
      status: "ONLINE",
      avatar: "AR",
    },
  })
  console.log("Created admin user")

  const settings = [
    { key: "company_name", value: "IMARAT Corporation" },
    { key: "support_email", value: "itsupport@imarat.com" },
    { key: "support_phone", value: "+92-21-XXXX-XXXX" },
    { key: "timezone", value: "Asia/Karachi" },
    { key: "business_hours_start", value: "08:00" },
    { key: "business_hours_end", value: "18:00" },
    { key: "chat_auto_assign", value: "true" },
    { key: "chat_routing_strategy", value: "round-robin" },
    { key: "chat_idle_timeout", value: "300" },
    { key: "chat_max_queue", value: "50" },
    { key: "sla_critical_response", value: "0.5" },
    { key: "sla_critical_resolution", value: "2" },
    { key: "sla_high_response", value: "1" },
    { key: "sla_high_resolution", value: "4" },
    { key: "sla_medium_response", value: "2" },
    { key: "sla_medium_resolution", value: "8" },
    { key: "sla_low_response", value: "4" },
    { key: "sla_low_resolution", value: "24" },
    { key: "email_notifications", value: "true" },
    { key: "browser_notifications", value: "true" },
    { key: "ai_suggestions", value: "true" },
  ]
  for (const s of settings) {
    await prisma.systemSettings.create({ data: s })
  }
  console.log("Created system settings")
  console.log("Seeding complete!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })