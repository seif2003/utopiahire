import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // First check if the user owns this job
    const { data: job, error: jobError } = await supabase
      .from('job_offers')
      .select('posted_by')
      .eq('id', params.id)
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
          avatar_url,
          phone,
          location
        )
      `)
      .eq('job_id', params.id)
      .order('applied_at', { ascending: false })

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json(applications || [])
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
