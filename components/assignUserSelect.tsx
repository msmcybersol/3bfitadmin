// components/assignUserSelect.tsx

'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabaseClient'

type StaffUser = {
  id: string
  role: string
}

export default function AssignUserSelect({ id, currentAssignedTo }: { id: string; currentAssignedTo: string | null }) {
  const supabase = createClient()
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [assignedTo, setAssignedTo] = useState(currentAssignedTo ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const hasChanged = assignedTo !== (currentAssignedTo ?? '')

  useEffect(() => {
    const loadStaff = async () => {
      const { data, error } = await supabase.from('users').select('id, role').in('role', ['admin', 'moderator', 'support']).order('role')
      if (!error && data) setStaff(data)
    }
    void loadStaff()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('feedback_submissions').update({
      assigned_to: assignedTo || null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    }).eq('id', id)

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Error updating assignment')
    }
  }

  return (
    <div className="space-y-3">
      <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="border rounded p-2">
        <option value="">Unassigned</option>
        {staff.map((member) => (
          <option key={member.id} value={member.id}>
            {member.role} — {member.id}
          </option>
        ))}
      </select>

      {hasChanged && (
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">
          {saving ? 'Saving...' : 'Save Assignment'}
        </button>
      )}

      {saved && (
        <div className="text-green-600 text-sm">Assignment updated</div>
      )}
    </div>
  )
}