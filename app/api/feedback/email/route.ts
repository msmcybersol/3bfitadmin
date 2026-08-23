// app/api/feedback/email/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: staffUser, error: staffError } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (staffError || !staffUser || !['admin', 'moderator', 'support'].includes(staffUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : ''
  const content = typeof body?.content === 'string' ? body.content.trim() : ''

  if (!submissionId || !content) {
    return NextResponse.json({ error: 'Submission ID and comment content are required' }, { status: 400 })
  }

  const { data: submission, error: submissionError } = await supabase.from('feedback_submissions').select('user_id, title').eq('id', submissionId).single()

  if (submissionError || !submission?.user_id) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  const { data: profile, error: profileError } = await supabase.from('user_profiles').select('email, first_name').eq('id', submission.user_id).single()

  if (profileError || !profile?.email) {
    return NextResponse.json({ error: 'User does not have a feedback email address' }, { status: 422 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: 'Email service is not configured' }, { status: 500 })
  }

  const greeting = profile.first_name ? `Hi ${profile.first_name},` : 'Hello,'
  const safeContent = escapeHtml(content)
  const safeTitle = escapeHtml(submission.title)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [profile.email],
      subject: `3BFit Feedback Update: ${submission.title}`,
      html: `<p>${greeting}</p><p>There is an update regarding your 3BFit feedback submission:</p><p><strong>${safeTitle}</strong></p><p>${safeContent.replace(/\n/g, '<br />')}</p><p>You can also view this conversation from Settings → Developer's Feedback Hub → My Requests in the 3BFit app.</p><p>3BFit Support</p>`,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[Feedback Email] Resend error:', errorBody)
    return NextResponse.json({ error: 'Email delivery failed' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }

    return entities[character]
  })
}