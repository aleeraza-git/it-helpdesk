import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { action, context } = await req.json()

  // Inline AI responses without external API call for demo
  const suggestions: Record<string, string[]> = {
    suggest_reply: [
      'Based on the issue described, I recommend checking the Windows Event Viewer under Application logs for related error codes. Navigate to Start > Event Viewer > Windows Logs > Application.',
      'This appears to be a configuration issue. I suggest verifying the user account status in Active Directory and checking for any Group Policy conflicts that might be affecting this setting.',
      'The symptoms indicate this could be a corrupted profile. Creating a temporary test account would help isolate whether the issue is user profile-specific or system-wide.',
      'I can see this is a connectivity problem. Could you confirm whether the issue occurs on all devices on the same network, or only on this specific device? This will help determine if it is device-specific.',
      'Based on similar cases, running the built-in Windows Network Diagnostics (netsh winsock reset) may resolve this. Please try this and restart the device before we proceed further.',
    ],
    summarize: [
      'User reporting VPN connectivity issue. Error 691 encountered. Domain prefix confirmed correct. Account status checked, not locked. Network team investigating firewall rules. Estimated resolution: 2 hours.',
      'Software configuration issue affecting email signature display. User on Outlook 2021 desktop and OWA mobile. Issue started after recent Office update. Investigating known compatibility issue.',
      'Hardware procurement request submitted. Business justification provided. Manager approval pending. Standard catalog item, expected processing time 3-5 business days.',
    ],
    detect_issue: [
      'Issue Category: Network/VPN | Severity: High | Root Cause: Authentication configuration | Estimated Time: 30-60 minutes | Suggested KB: VPN Setup Guide',
      'Issue Category: Software | Severity: Medium | Root Cause: Configuration drift after update | Estimated Time: 15-30 minutes | Suggested KB: Outlook Signature Guide',
      'Issue Category: Security | Severity: Critical | Root Cause: Account lockout | Estimated Time: Immediate | Action Required: Escalate to security team',
    ],
  }

  const list = suggestions[action] || suggestions.suggest_reply
  const response = list[Math.floor(Math.random() * list.length)]
  return NextResponse.json({ response, action })
}
