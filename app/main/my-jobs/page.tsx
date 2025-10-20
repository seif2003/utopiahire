import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { MyJobsContent } from '@/components/my-jobs-content'


export default async function MyJobsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <MyJobsContent userId={user.id} />
}
