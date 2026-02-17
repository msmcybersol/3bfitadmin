'use client'

// components/submissionTable.tsx

import { useRouter } from 'next/navigation'
import StatusBadge from './statusBadge'
import PriorityBadge from './priorityBadge'

export default function SubmissionTable({
  submissions,
}: {
  submissions: any[]
}) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">Type</th>
            <th className="p-3">Status</th>
            <th className="p-3">Priority</th>
            <th className="p-3">Platform</th>
            <th className="p-3">Created</th>
          </tr>
        </thead>

        <tbody>
          {submissions.map((s) => (
            <tr
              key={s.id}
              onClick={() => router.push(`/submissions/${s.id}`)}
              className="border-t hover:bg-gray-50 cursor-pointer"
            >
              <td className="p-3 font-medium">{s.title}</td>
              <td className="p-3">{s.type}</td>
              <td className="p-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="p-3">
                <PriorityBadge priority={s.priority} />
              </td>
              <td className="p-3">{s.device_platform}</td>
              <td className="p-3">
                {new Date(s.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}