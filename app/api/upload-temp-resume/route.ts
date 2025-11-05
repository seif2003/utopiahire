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
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF, DOC, and DOCX files are allowed' },
        { status: 400 }
      )
    }

    // Upload temporary file to Supabase storage (separate bucket or folder)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `temp/${user.id}_${timestamp}.${fileExtension}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('resumes')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: 'no-cache, no-store, must-revalidate',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload file', details: uploadError.message },
          { status: 500 }
        )
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('resumes')
        .getPublicUrl(fileName)

      return NextResponse.json({
        success: true,
        url: publicUrl,
        message: 'Resume uploaded successfully'
      })
    } catch (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing resume:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
