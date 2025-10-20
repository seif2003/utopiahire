import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { job_id, cover_letter, resume_url, email, phone } = body

    if (!job_id || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already applied to this job
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('user_id', user.id)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    // Create application
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        job_id,
        user_id: user.id,
        cover_letter,
        resume_url,
        status: 'pending',
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Error creating application:', applicationError)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // Update profile with latest contact info if changed
    await supabase
      .from('profiles')
      .update({ email, phone })
      .eq('id', user.id)

    // Increment applications count on job
    const { data: job } = await supabase
      .from('job_offers')
      .select('applications_count')
      .eq('id', job_id)
      .single()

    if (job) {
      await supabase
        .from('job_offers')
        .update({ applications_count: (job.applications_count || 0) + 1 })
        .eq('id', job_id)
    }

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
