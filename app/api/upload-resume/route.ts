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

    // Send file to n8n for processing
    const n8nFormData = new FormData()
    n8nFormData.append('document', file)
    n8nFormData.append('user_id', user.id)

    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.benamara.tn/webhook/autopiahire/scan'
    const apiKey = process.env.N8N_API_KEY || ''

    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'api_key': apiKey,
      },
      body: n8nFormData,
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('n8n error:', errorText)
      return NextResponse.json(
        { error: 'Failed to process resume', details: errorText },
        { status: 500 }
      )
    }

    const n8nResult = await n8nResponse.json()

    // Also upload the file to Supabase storage for backup
    try {
      // Delete old resume file if exists
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('resume')
        .eq('id', user.id)
        .single()

      if (profile?.resume) {
        const oldFileName = profile.resume.split('/').pop()?.split('?')[0]
        if (oldFileName) {
          await supabaseAdmin.storage
            .from('resumes')
            .remove([oldFileName])
            .catch(() => {}) // Ignore errors
        }
      }

      // Upload new file
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const timestamp = new Date().toISOString()
      const fileName = `${user.id}_${timestamp}.pdf`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('resumes')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: 'no-cache, no-store, must-revalidate',
          upsert: false,
        })

      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('resumes')
          .getPublicUrl(fileName)

        // Update profile with resume URL
        await supabaseAdmin
          .from('profiles')
          .update({ 
            resume: publicUrl,
            is_resume_latex: false,
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id)
      }
    } catch (storageError) {
      console.error('Storage error (non-fatal):', storageError)
    }

    return NextResponse.json({
      success: true,
      message: 'Resume processed successfully',
      data: n8nResult
    })
  } catch (error) {
    console.error('Error processing resume:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
