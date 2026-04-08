import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function GET(req: NextRequest) {
  const vars = {
    SMTP_HOST: process.env.SMTP_HOST || "MISSING",
    SMTP_PORT: process.env.SMTP_PORT || "MISSING",
    SMTP_USER: process.env.SMTP_USER || "MISSING",
    SMTP_PASS: process.env.SMTP_PASS ? "SET" : "MISSING",
    SMTP_FROM: process.env.SMTP_FROM || "MISSING",
  }

  try {
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

    await transporter.verify()

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: "Vercel Email Test - IMARAT Portal",
      text: "Email is working from Vercel!",
    })

    return NextResponse.json({ success: true, vars, message: "Email sent successfully" })
  } catch (err: any) {
    return NextResponse.json({ success: false, vars, error: err.message }, { status: 500 })
  }
}