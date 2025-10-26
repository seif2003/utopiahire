import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId } = await request.json()

    // Simply update profile to mark first_login as false
    // Do NOT call n8n to generate resume
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
