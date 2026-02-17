// components/statusBadge.tsx

export default function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800',
    in_review: 'bg-blue-100 text-blue-800',
    planned: 'bg-purple-100 text-purple-800',
    closed: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        colors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  )
}