// F:/AppDev/3bfit/_admin/components/commentThread.tsx

'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabaseClient'

type FeedbackComment = {
  id: string
  author_id: string
  author_role: string
  content: string
  is_internal: boolean
  created_at: string
}

export default function CommentThread({ submissionId }: { submissionId: string }) {
  const supabase = createClient()
  const [comments, setComments] = useState<FeedbackComment[]>([])
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadComments = async () => {
    const { data, error } = await supabase.from('feedback_comments').select('id, author_id, author_role, content, is_internal, created_at').eq('submission_id', submissionId).order('created_at', { ascending: true })
    if (!error && data) setComments(data)
  }

  useEffect(() => {
    void loadComments()
  }, [submissionId])

  const handleSubmit = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      alert('Unable to identify signed-in staff user')
      return
    }

    const { data: dbUser, error: userError } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userError || !dbUser) {
      setSaving(false)
      alert('Unable to identify staff role')
      return
    }

    const { error } = await supabase.from('feedback_comments').insert({
      submission_id: submissionId,
      author_id: user.id,
      author_role: dbUser.role,
      content: trimmedContent,
      is_internal: isInternal,
    })

    setSaving(false)

    if (error) {
      alert('Error adding comment')
      return
    }

    setContent('')
    setIsInternal(false)
    await loadComments()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.length === 0 && (
          <div className="text-sm text-gray-500">No comments yet.</div>
        )}

        {comments.map((comment) => (
          <div key={comment.id} className="border rounded p-4 space-y-2">
            <div className="flex gap-3 text-sm">
              <span className="font-semibold">{comment.author_role}</span>
              <span className={comment.is_internal ? 'text-orange-600' : 'text-blue-600'}>{comment.is_internal ? 'Internal' : 'Public'}</span>
              <span className="text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <div>{comment.content}</div>
          </div>
        ))}
      </div>

      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a comment..." className="border rounded p-3 w-full min-h-28" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
        Internal comment
      </label>

      <button onClick={handleSubmit} disabled={saving || !content.trim()} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {saving ? 'Adding...' : 'Add Comment'}
      </button>
    </div>
  )
}