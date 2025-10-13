import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId, hasResume } = await request.json()

    // Update profile to mark first_login as false
    const { error } = await supabase
      .from('profiles')
      .update({ first_login: false })
      .eq('id', userId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Send webhook request to n8n to create resume
    // Wait for 200 response before proceeding
    const webhookResponse = await fetch('https://n8n.benamara.tn/webhook-test/autopiahire/create-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': process.env.N8N_API_KEY || '',
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('n8n webhook failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate resume. Please try again.' },
        { status: 500 }
      )
    }

    const webhookData = await webhookResponse.json()
    console.log('n8n webhook successful:', webhookData)

    // Update profile with resume URL and LaTeX code if provided by n8n
    if (webhookData.resume_url || webhookData.latex_code) {
      const updateData: any = {}
      
      if (webhookData.resume_url) {
        updateData.resume = webhookData.resume_url
      }
      
      if (webhookData.latex_code) {
        updateData.resume_latex = webhookData.latex_code
        updateData.is_resume_latex = true
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
      
      if (updateError) {
        console.error('Failed to update profile with resume data:', updateError)
      }
    }

    return NextResponse.json({ success: true, data: webhookData })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
