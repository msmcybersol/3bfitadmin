// app/page.tsx

import { createClient } from '@/lib/supabaseServer'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: submissions, error } = await supabase
    .from('feedback_submissions')
    .select('status, priority')

  if (error) {
    return (
      <div className="p-10 text-red-500">
        Error loading dashboard data.
      </div>
    )
  }

  const counts = {
    open: 0,
    in_review: 0,
    planned: 0,
    closed: 0,
    declined: 0,
    high: 0,
    critical: 0,
  }

  submissions?.forEach((s) => {
    if (counts[s.status as keyof typeof counts] !== undefined) {
      counts[s.status as keyof typeof counts]++
    }

    if (s.priority === 'high') counts.high++
    if (s.priority === 'critical') counts.critical++
  })

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">
        3BFit Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card label="Open" value={counts.open} />
        <Card label="In Review" value={counts.in_review} />
        <Card label="Planned" value={counts.planned} />
        <Card label="Closed" value={counts.closed} />
        <Card label="Declined" value={counts.declined} />
        <Card label="High Priority" value={counts.high} />
        <Card label="Critical" value={counts.critical} />
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-6 shadow">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  )
}