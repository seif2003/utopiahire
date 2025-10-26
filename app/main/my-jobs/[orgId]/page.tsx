import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { OrganizationJobsContent } from '@/components/organization-jobs-content'


interface PageProps {
  params: { orgId: string }
}

export default async function OrganizationJobsPage({ params }: PageProps) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const organizationId = params.orgId

  if (!organizationId) {
    redirect('/main/my-jobs')
  }

  // Verify user owns the organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  if (orgError || !organization) {
    redirect('/main/my-jobs')
  }

  if (organization.owner_id !== user.id) {
    redirect('/main/my-jobs')
  }

  return <OrganizationJobsContent organization={organization} userId={user.id} />
}
