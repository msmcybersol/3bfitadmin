// components/statusEditor.tsx

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function StatusEditor({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: string
}) {
  const supabase = createClient()

  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasChanged = status !== currentStatus

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    }

    if (status === 'closed') {
      updates.resolved_at = new Date().toISOString()
    } else {
      updates.resolved_at = null
    }

    const { error } = await supabase
      .from('feedback_submissions')
      .update(updates)
      .eq('id', id)

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Error updating status')
    }
  }

  return (
    <div className="space-y-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border rounded p-2"
      >
        <option value="open">Open</option>
        <option value="in_review">In Review</option>
        <option value="planned">Planned</option>
        <option value="closed">Closed</option>
        <option value="declined">Declined</option>
      </select>

      {hasChanged && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      )}

      {saved && (
        <div className="text-green-600 text-sm">
          Status updated
        </div>
      )}
    </div>
  )
}