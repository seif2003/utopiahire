import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, latex_code } = await request.json()

    if (!user_id || !latex_code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send LaTeX to n8n for compilation
    console.log('Sending LaTeX to n8n for user:', user_id)
    console.log('LaTeX code length:', latex_code.length)
    
    const webhookResponse = await fetch(
      process.env.N8N_COMPILE_LATEX_URL || 'https://n8n.benamara.tn/webhook-test/autopiahire/compile-latex',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({
          user_id,
          latex_code,
        }),
      }
    )

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('n8n LaTeX compilation failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to compile LaTeX. Please check your code.' },
        { status: 500 }
      )
    }

    const data = await webhookResponse.json()
    console.log('n8n LaTeX compilation successful:', data)

    return NextResponse.json({ 
      success: true, 
      resume_url: data.resume_url || data.pdf_url 
    })
  } catch (error) {
    console.error('LaTeX compilation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
