import { redirect } from 'next/navigation'

import { createClient } from '@/lib/server'
import { OnboardingFlow } from '@/components/onboarding-flow'


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

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p className="text-2xl">
        Welcome back to Utopia Hire!
      </p>
    </div>
  )
}
