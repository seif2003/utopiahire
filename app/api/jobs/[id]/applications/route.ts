import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // First check if the user owns this job
    const { data: job, error: jobError } = await supabase
      .from('job_offers')
      .select('posted_by')
      .eq('id', id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.posted_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Fetch applications with profile data
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone,
          location,
          profile_picture,
          headline,
          bio,
          work_preference,
          resume
        )
      `)
      .eq('job_id', id)
      .order('applied_at', { ascending: false })

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Fetch additional data for each application
    const applicationsWithDetails = await Promise.all(
      (applications || []).map(async (app) => {
        // Get experiences
        const { data: experiences } = await supabase
          .from('experiences')
          .select('*')
          .eq('user_id', app.user_id)
          .order('start_date', { ascending: false })
          .limit(3)

        // Get education
        const { data: education } = await supabase
          .from('education')
          .select('*')
          .eq('user_id', app.user_id)
          .order('start_date', { ascending: false })
          .limit(2)

        // Get skills
        const { data: skills } = await supabase
          .from('skills')
          .select('*')
          .eq('user_id', app.user_id)
          .limit(10)

        return {
          ...app,
          experiences: experiences || [],
          education: education || [],
          skills: skills || []
        }
      })
    )

    return NextResponse.json(applicationsWithDetails)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
