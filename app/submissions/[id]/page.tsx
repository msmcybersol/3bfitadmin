// app/submissions/[id]/page.tsx

import { createClient } from '@/lib/supabaseServer'

export default async function SubmissionDetail(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: submission, error } = await supabase
    .from('feedback_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !submission) {
    return (
      <div className="p-10 text-red-500">
        Submission not found.
      </div>
    )
  }

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">
        {submission.title}
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <Info label="Type" value={submission.type} />
        <Info label="Status" value={submission.status} />
        <Info label="Priority" value={submission.priority || '-'} />
        <Info label="Platform" value={submission.device_platform || '-'} />
        <Info label="App Version" value={submission.app_version || '-'} />
        <Info label="Module" value={submission.module || '-'} />
      </div>

      <Section title="Description">
        {submission.description}
      </Section>

      {submission.expected_behavior && (
        <Section title="Expected Behavior">
          {submission.expected_behavior}
        </Section>
      )}

      {submission.reproduction_steps && (
        <Section title="Reproduction Steps">
          {submission.reproduction_steps}
        </Section>
      )}

      {submission.metadata && (
        <Section title="Metadata">
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(submission.metadata, null, 2)}
          </pre>
        </Section>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="border rounded p-4">{children}</div>
    </div>
  )
}