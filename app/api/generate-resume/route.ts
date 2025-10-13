import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Send webhook request to n8n to create resume
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

    return NextResponse.json({ success: true, data: webhookData })
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
