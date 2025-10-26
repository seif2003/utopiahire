import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { ProfileReviewStepper } from '@/components/profile-review-stepper'

export default async function ProfileReviewPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch existing profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: experiences } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })

  const { data: education } = await supabase
    .from('education')
    .select('*')
    .eq('user_id', user.id)
    .order('start_year', { ascending: false })

  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', user.id)

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', user.id)
    .order('year', { ascending: false })

  const { data: languages } = await supabase
    .from('languages')
    .select('*')
    .eq('user_id', user.id)

  const { data: values_preferences } = await supabase
    .from('values_preferences')
    .select('*')
    .eq('user_id', user.id)

  return (
    <ProfileReviewStepper
      userId={user.id}
      userEmail={user.email || ''}
      existingData={{
        profile: profile || {},
        experiences: experiences || [],
        education: education || [],
        skills: skills || [],
        projects: projects || [],
        certifications: certifications || [],
        languages: languages || [],
        values_preferences: values_preferences || [],
      }}
    />
  )
}
