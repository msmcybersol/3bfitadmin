// app/submissions/[id]/page.tsx

import { createClient } from '@/lib/supabaseServer'
import StatusEditor from '@/components/statusEditor'

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

      <div className="flex flex-col gap-3 items-start">
        <Info label="Type" value={submission.type} />

        <div className="inline-flex justify-between items-center gap-6 border rounded px-4 py-2 w-fit min-w-[320px]">
          <span className="text-sm text-gray-500">Status</span>
          <StatusEditor
            id={submission.id}
            currentStatus={submission.status}
          />
        </div>

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
    <div className="inline-flex justify-between items-center gap-6 border rounded px-4 py-2 w-fit min-w-[320px]">
      <span className="text-sm text-gray-500 whitespace-nowrap">
        {label}
      </span>
      <span className="font-medium">
        {value}
      </span>
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
    <div className="space-y-2 max-w-4xl">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>
      <div className="border rounded p-4 w-fit min-w-[400px]">
        {children}
      </div>
    </div>
  )
}