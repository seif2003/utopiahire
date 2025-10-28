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

    // Get request body with pagination, query, and filters
    const body = await request.json()
    const { 
      page = 0, 
      page_size = 10, 
      query,
      // Basic filter parameters
      location,
      employment_type, // e.g., 'full-time', 'part-time', 'contract', 'internship'
      experience_level, // e.g., 'entry', 'mid', 'senior', 'lead', 'executive'
      is_remote,
      is_hybrid,
      salary_min,
      salary_max,
      salary_currency, // e.g., 'USD', 'EUR', 'GBP'
      required_skills, // array of skills
      preferred_skills, // array of preferred skills
      company_name,
      // Additional filter parameters
      posted_days_ago, // number of days (e.g., 1, 7, 30)
      job_category, // e.g., 'Engineering', 'Marketing', 'Sales', 'Design'
      industry, // e.g., 'Technology', 'Healthcare', 'Finance'
      company_size, // e.g., 'startup', 'small', 'medium', 'large', 'enterprise'
      education_required, // e.g., 'high-school', 'bachelors', 'masters', 'phd'
      visa_sponsorship, // boolean
      benefits, // array of benefits (e.g., ['health-insurance', '401k', 'remote-work'])
      languages, // array of languages required
      // Sorting parameters
      sort_by, // e.g., 'relevance', 'date', 'salary', 'company'
      sort_order, // 'asc' or 'desc'
    } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Call n8n webhook
    const n8nUrl = 'https://n8n.benamara.tn/webhook/autopiahire/get-jobs'
    
    const url = new URL(n8nUrl)
    url.searchParams.set('page', String(page))
    url.searchParams.set('page_size', String(page_size))
    url.searchParams.set('query', String(query))
    
    // Add optional basic filter parameters
    if (location) url.searchParams.set('location', location)
    if (employment_type) url.searchParams.set('employment_type', employment_type)
    if (experience_level) url.searchParams.set('experience_level', experience_level)
    if (is_remote !== undefined) url.searchParams.set('is_remote', String(is_remote))
    if (is_hybrid !== undefined) url.searchParams.set('is_hybrid', String(is_hybrid))
    if (salary_min) url.searchParams.set('salary_min', String(salary_min))
    if (salary_max) url.searchParams.set('salary_max', String(salary_max))
    if (salary_currency) url.searchParams.set('salary_currency', salary_currency)
    if (required_skills && Array.isArray(required_skills) && required_skills.length > 0) {
      url.searchParams.set('required_skills', required_skills.join(','))
    }
    if (preferred_skills && Array.isArray(preferred_skills) && preferred_skills.length > 0) {
      url.searchParams.set('preferred_skills', preferred_skills.join(','))
    }
    if (company_name) url.searchParams.set('company_name', company_name)
    
    // Add optional advanced filter parameters
    if (posted_days_ago) url.searchParams.set('posted_days_ago', String(posted_days_ago))
    if (job_category) url.searchParams.set('job_category', job_category)
    if (industry) url.searchParams.set('industry', industry)
    if (company_size) url.searchParams.set('company_size', company_size)
    if (education_required) url.searchParams.set('education_required', education_required)
    if (visa_sponsorship !== undefined) url.searchParams.set('visa_sponsorship', String(visa_sponsorship))
    if (benefits && Array.isArray(benefits) && benefits.length > 0) {
      url.searchParams.set('benefits', benefits.join(','))
    }
    if (languages && Array.isArray(languages) && languages.length > 0) {
      url.searchParams.set('languages', languages.join(','))
    }
    
    // Add sorting parameters
    if (sort_by) url.searchParams.set('sort_by', sort_by)
    if (sort_order) url.searchParams.set('sort_order', sort_order)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'api_key': n8nApiKey,
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get jobs from n8n', details: errorText },
        { status: response.status }
      )
    }

    // Check if response has content
    const text = await response.text()
    console.log('Response text:', text)
    
    if (!text || text.trim() === '') {
      console.error('Empty response from n8n')
      return NextResponse.json(
        { error: 'Empty response from n8n' },
        { status: 500 }
      )
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', text)
      return NextResponse.json(
        { error: 'Invalid JSON response from n8n', details: text },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
