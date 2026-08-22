// components/assignUserSelect.tsx

'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabaseClient'

type StaffUser = {
  id: string
  role: string
  first_name: string | null
  last_name: string | null
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
      const { data: staffUsers, error: staffError } = await supabase.from('users').select('id, role').in('role', ['admin', 'moderator', 'support']).order('role')
      if (staffError || !staffUsers) return

      const ids = staffUsers.map((member) => member.id)
      const { data: profiles, error: profileError } = await supabase.from('user_profiles').select('id, first_name, last_name').in('id', ids)
      if (profileError || !profiles) return

      const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
      setStaff(staffUsers.map((member) => {
        const profile = profileMap.get(member.id)

        return {
          id: member.id,
          role: member.role,
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
        }
      }))
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
        {staff.map((member) => {
          const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ')

          return (
            <option key={member.id} value={member.id}>{fullName || member.id} - {member.role}</option>
          )
        })}
      </select>

      {hasChanged && (
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">{saving ? 'Saving...' : 'Save Assignment'}</button>
      )}

      {saved && (
        <div className="text-green-600 text-sm">Assignment updated</div>
      )}
    </div>
  )
}