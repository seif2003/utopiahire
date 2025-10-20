import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { JobDetails } from '@/components/job-details'


export default async function JobPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return <JobDetails jobId={params.id} />
}
