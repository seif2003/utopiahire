import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { ResumeBuilder } from '@/components/resume-builder'

export default async function ResumeBuilderPage() {
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

  const { data: valuesPreferences } = await supabase
    .from('values_and_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <ResumeBuilder
      userId={user.id}
      userEmail={user.email || ''}
      existingData={{
        profile: profile || null,
        experiences: experiences || [],
        education: education || [],
        skills: skills || [],
        projects: projects || [],
        certifications: certifications || [],
        languages: languages || [],
        valuesPreferences: valuesPreferences || null,
      }}
    />
  )
}
