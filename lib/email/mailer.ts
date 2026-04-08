import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
})

const FROM = process.env.SMTP_FROM || "IMARAT IT Support <it.support@imarat.com.pk>"
const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL || "https://it-helpdesk.vercel.app"

function baseTemplate(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>IMARAT IT Support</title></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:32px 16px;"><div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><div style="background:linear-gradient(135deg,#1e3a5f,#0f1e3a);padding:24px 32px;border-bottom:1px solid #1e2d45;"><div style="font-size:18px;font-weight:700;color:#ffffff;">IMARAT IT Support</div><div style="font-size:12px;color:#94a3b8;margin-top:2px;">it.support@imarat.com.pk</div></div><div style="padding:32px;">${content}</div></div><div style="padding:16px 32px;text-align:center;"><p style="font-size:12px;color:#94a3b8;margin:0;">This is an automated email from IMARAT IT Support Portal. Please do not reply.</p><p style="font-size:11px;color:#cbd5e1;margin:6px 0 0;">IMARAT Corporation &bull; Support Hours: Mon-Fri 8AM-6PM PKT</p></div></div></body></html>`
}

export async function sendTicketConfirmation({ name, email, ticketNumber, subject, priority, category }: {
  name: string; email: string; ticketNumber: string; subject: string; priority: string; category: string
}) {
  const priorityColors: Record<string,string> = { CRITICAL: "#ef4444", HIGH: "#ea580c", MEDIUM: "#f59e0b", LOW: "#10b981" }
  const color = priorityColors[priority] || "#f59e0b"
  const content = `
    <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Ticket Submitted Successfully</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 24px;">Hello ${name}, we have received your support request.</p>
    <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em;">Your Ticket Number</div>
      <div style="font-size:36px;font-weight:800;color:#2563eb;letter-spacing:0.15em;">#${ticketNumber}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Save this number to track your request</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px 0;font-size:13px;color:#94a3b8;width:40%;">Subject</td><td style="padding:10px 0;font-size:13px;color:#0f172a;font-weight:500;">${subject}</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px 0;font-size:13px;color:#94a3b8;">Category</td><td style="padding:10px 0;font-size:13px;color:#0f172a;font-weight:500;">${category}</td></tr>
      <tr><td style="padding:10px 0;font-size:13px;color:#94a3b8;">Priority</td><td style="padding:10px 0;"><span style="background:${color}18;color:${color};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;">${priority}</span></td></tr>
    </table>
    <a href="${PORTAL_URL}/support/track" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px 24px;border-radius:9px;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:16px;">Track My Ticket</a>
    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">Our team responds within business hours (Mon-Fri, 8AM-6PM PKT)</p>`
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `[Ticket #${ticketNumber}] ${subject} - IMARAT IT Support`,
    html: baseTemplate(content),
  })
}

export async function sendTicketUpdate({ name, email, ticketNumber, subject, status, comment, agentName }: {
  name: string; email: string; ticketNumber: string; subject: string; status: string; comment?: string; agentName?: string
}) {
  const statusColors: Record<string,string> = { OPEN: "#2563eb", IN_PROGRESS: "#7c3aed", PENDING: "#d97706", RESOLVED: "#059669", CLOSED: "#6b7280" }
  const color = statusColors[status] || "#2563eb"
  const content = `
    <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Ticket Updated</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 24px;">Hello ${name}, your support ticket has been updated.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;color:#94a3b8;">Ticket #${ticketNumber}</span>
        <span style="background:${color}18;color:${color};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;">${status.replace("_"," ")}</span>
      </div>
      <div style="font-size:14px;font-weight:600;color:#0f172a;">${subject}</div>
      ${agentName ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px;">Assigned to: ${agentName}</div>` : ""}
    </div>
    ${comment ? `<div style="background:#eff6ff;border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:16px;margin-bottom:20px;"><div style="font-size:12px;color:#94a3b8;margin-bottom:8px;font-weight:600;">AGENT UPDATE</div><div style="font-size:14px;color:#0f172a;line-height:1.6;">${comment}</div></div>` : ""}
    <a href="${PORTAL_URL}/support/track" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px 24px;border-radius:9px;font-size:14px;font-weight:600;text-decoration:none;">View Ticket Status</a>`
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `[Ticket #${ticketNumber}] Update: ${status.replace("_"," ")} - IMARAT IT Support`,
    html: baseTemplate(content),
  })
}

export async function sendChatTranscript({ name, email, subject, agentName, messages }: {
  name: string; email: string; subject: string; agentName: string
  messages: { sender: string; text: string; time: string }[]
}) {
  const msgHtml = messages.filter(m => m.sender !== "SYSTEM").map(m => `
    <div style="margin-bottom:12px;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;font-weight:600;">${m.sender} &bull; ${m.time}</div>
      <div style="background:#f8fafc;padding:10px 14px;border-radius:8px;font-size:13px;color:#0f172a;line-height:1.6;border:1px solid #e2e8f0;">${m.text}</div>
    </div>`).join("")
  const content = `
    <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Chat Resolved</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 24px;">Hello ${name}, your support chat has been resolved. Here is your transcript.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:20px;">
      <div style="font-size:13px;color:#94a3b8;margin-bottom:4px;">Subject</div>
      <div style="font-size:14px;font-weight:600;color:#0f172a;">${subject}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:6px;">Agent: ${agentName}</div>
    </div>
    <div style="margin-bottom:20px;">${msgHtml}</div>
    <p style="font-size:13px;color:#94a3b8;text-align:center;">If your issue recurs, please start a new chat or submit a ticket.</p>`
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `Chat Resolved: ${subject} - IMARAT IT Support`,
    html: baseTemplate(content),
  })
}