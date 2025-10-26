import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/server'

// Create a Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('resume') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Delete old resume file if exists
    try {
      // Get current resume URL from profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('resume')
        .eq('id', user.id)
        .single()

      if (profile?.resume) {
        // Extract filename from URL
        const oldFileName = profile.resume.split('/').pop()?.split('?')[0]
        if (oldFileName) {
          // Delete old file (ignore errors if file doesn't exist)
          await supabaseAdmin.storage
            .from('resumes')
            .remove([oldFileName])
        }
      }
    } catch (error) {
      console.log('No old resume to delete or error deleting:', error)
    }

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use datetime-based filename to avoid caching issues
    const timestamp = new Date().toISOString()
    const fileName = `${user.id}_${timestamp}.pdf`

    // Upload using service role client (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        cacheControl: 'no-cache, no-store, must-revalidate',
        upsert: false, // Don't overwrite, create new file
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload resume' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('resumes')
      .getPublicUrl(fileName)

    // Update profile with resume URL and set is_resume_latex to false
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        resume: publicUrl,
        is_resume_latex: false 
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    })
  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
