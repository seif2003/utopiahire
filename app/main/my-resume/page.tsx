import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { ResumeViewer } from '@/components/resume-viewer'


export default async function MyResumePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile with resume data
  const { data: profile } = await supabase
    .from('profiles')
    .select('resume, resume_latex, is_resume_latex')
    .eq('id', user.id)
    .single()

  if (!profile?.resume) {
    // No resume yet, redirect to resume builder
    redirect('/main/resume-builder')
  }

  return (
    <ResumeViewer
      userId={user.id}
      resumeUrl={profile.resume}
      resumeLatex={profile.resume_latex}
      isResumeLatex={profile.is_resume_latex}
    />
  )
}
