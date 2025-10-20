import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { JobApplications } from '@/components/job-applications'


export default async function JobApplicationsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <JobApplications jobId={params.id} userId={user.id} />
}
