// components/priorityBadge.tsx

export default function PriorityBadge({
  priority,
}: {
  priority: string | null
}) {
  if (!priority) return <span>-</span>

  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        colors[priority] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {priority}
    </span>
  )
}