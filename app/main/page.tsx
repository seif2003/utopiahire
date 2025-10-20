import { redirect } from 'next/navigation'

import { createClient } from '@/lib/server'
import { OnboardingFlow } from '@/components/onboarding-flow'
import { MainContent } from '@/components/main-content'



export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  // Get user profile to check if first login
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Check if profile exists and if it's first login
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_login')
    .eq('id', user.id)
    .single()

  const isFirstLogin = !profile || profile.first_login

  if (isFirstLogin) {
    return <OnboardingFlow userId={user.id} />
  }

  return <MainContent />
}
