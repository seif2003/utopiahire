import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { JobDetails } from '@/components/job-details'


export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { id } = await params

  return <JobDetails jobId={id} />
}
