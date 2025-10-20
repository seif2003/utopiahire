import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(request: NextRequest) {
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

    const n8nApiKey = process.env.N8N_API_KEY
    if (!n8nApiKey) {
      return NextResponse.json(
        { error: 'N8N API key not configured' },
        { status: 500 }
      )
    }

    // Call n8n webhook with user_id
    const n8nUrl = `https://n8n.benamara.tn/webhook-test/autopiahire/summarize?user_id=${user.id}`
    
    const response = await fetch(n8nUrl, {
      method: 'GET',
      headers: {
        'api_key': `${n8nApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get summary from n8n', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
