import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { MyProfileContent } from '@/components/my-profile-content'

export default async function MyProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all user data
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

  const { data: preferences } = await supabase
    .from('values_and_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: applications } = await supabase
    .from('job_applications')
    .select(`
      *,
      job_offers (
        id,
        title,
        company_name,
        location,
        employment_type
      )
    `)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  return (
    <MyProfileContent
      userId={user.id}
      userEmail={user.email || ''}
      profile={profile}
      experiences={experiences || []}
      education={education || []}
      skills={skills || []}
      projects={projects || []}
      certifications={certifications || []}
      languages={languages || []}
      preferences={preferences}
      applications={applications || []}
      resumeUrl={profile?.resume || null}
      resumeLatex={profile?.resume_latex || null}
      isResumeLatex={profile?.is_resume_latex || false}
    />
  )
}
