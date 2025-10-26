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

    // Fetch job from database
    const { data: job, error: jobError } = await supabase
      .from('job_offers')
      .select('*')
      .eq('id', id)
      .single()

    if (jobError) {
      console.error('Error fetching job:', jobError)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Increment views count
    await supabase
      .from('job_offers')
      .update({ views_count: (job.views_count || 0) + 1 })
      .eq('id', id)

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // First, delete associated documents from the documents table by job_id in metadata
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .contains('metadata', { job_id: id })

    if (documentsError) {
      console.error('Error deleting job documents:', documentsError)
      // Continue with job deletion even if documents deletion fails
    }

    // Delete job from database (RLS will ensure user can only delete their own jobs)
    const { error: deleteError } = await supabase
      .from('job_offers')
      .delete()
      .eq('id', id)
      .eq('posted_by', user.id)

    if (deleteError) {
      console.error('Error deleting job:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete job' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const body = await request.json()

    // Verify job ownership
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
        { error: 'You do not have permission to update this job' },
        { status: 403 }
      )
    }

    // Allowed fields to update
    const allowedFields = ['status', 'title', 'description', 'location', 'employment_type', 'experience_level']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // If status is being changed to 'active' and published_at is null, set it
    if (updateData.status === 'active') {
      const { data: currentJob } = await supabase
        .from('job_offers')
        .select('published_at')
        .eq('id', id)
        .single()
      
      if (!currentJob?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update job
    const { data: updatedJob, error: updateError } = await supabase
      .from('job_offers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating job:', updateError)
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedJob)
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
