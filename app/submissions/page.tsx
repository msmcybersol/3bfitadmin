// app/submissions/page.tsx

import { createClient } from '@/lib/supabaseServer'
import SubmissionTable from '@/components/submissionTable'

export default async function SubmissionsPage() {
  const supabase = await createClient()

  const { data: submissions, error } = await supabase
    .from('feedback_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-10 text-red-500">
        Error loading submissions.
      </div>
    )
  }

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">
        Feedback Submissions
      </h1>

      <SubmissionTable submissions={submissions || []} />
    </div>
  )
}