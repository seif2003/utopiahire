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

    const n8nApiKey = process.env.N8N_API_KEY
    if (!n8nApiKey) {
      return NextResponse.json(
        { error: 'N8N API key not configured' },
        { status: 500 }
      )
    }

    // Get request body with pagination and query
    const body = await request.json()
    const { page = 0, page_size = 10, query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Call n8n webhook
    const n8nUrl = 'https://n8n.benamara.tn/webhook-test/autopiahire/get-jobs'
    
    const url = new URL(n8nUrl)
    url.searchParams.set('page', String(page))
    url.searchParams.set('page_size', String(page_size))
    url.searchParams.set('query', String(query))

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'api_key': n8nApiKey,
        'Content-Type': 'application/json',
      },
    })

    console.log(response)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get jobs from n8n', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
