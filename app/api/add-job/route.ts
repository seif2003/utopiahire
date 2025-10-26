import { createClient } from '@/lib/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // If organization_id is provided, verify ownership
    if (body.organization_id) {
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('owner_id, name, logo_url, website, description')
        .eq('id', body.organization_id)
        .single();

      if (orgError || !organization) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      if (organization.owner_id !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to post jobs for this organization' },
          { status: 403 }
        );
      }

      // Use organization details if not provided in body
      if (!body.company_name) body.company_name = organization.name;
      if (!body.company_logo) body.company_logo = organization.logo_url;
      if (!body.company_website) body.company_website = organization.website;
      if (!body.company_description) body.company_description = organization.description;
    }

    // Prepare job offer data
    const jobData = {
      // Organization Reference (new)
      organization_id: body.organization_id || null,

      // Company Information (for legacy support or standalone jobs)
      company_name: body.company_name,
      company_logo: body.company_logo || null,
      company_website: body.company_website || null,
      company_description: body.company_description || null,

      // Job Details
      title: body.title,
      description: body.description,
      responsibilities: body.responsibilities || [],

      // Employment Details
      employment_type: body.employment_type,
      experience_level: body.experience_level,
      location: body.location,
      is_remote: body.is_remote || false,
      is_hybrid: body.is_hybrid || false,

      // Compensation
      salary_min: body.salary_min || null,
      salary_max: body.salary_max || null,
      salary_currency: body.salary_currency || 'USD',
      salary_period: body.salary_period || null,

      // Requirements
      required_skills: body.required_skills || [],
      preferred_skills: body.preferred_skills || [],
      required_experience_years: body.required_experience_years || null,
      education_requirements: body.education_requirements || [],
      language_requirements: body.language_requirements || null,

      // Application Details
      application_deadline: body.application_deadline || null,
      positions_available: body.positions_available || 1,
      application_url: body.application_url || null,
      contact_email: body.contact_email || null,

      // Additional Information
      benefits: body.benefits || [],
      company_culture: body.company_culture || [],
      work_schedule: body.work_schedule || null,
      relocation_assistance: body.relocation_assistance || false,
      visa_sponsorship: body.visa_sponsorship || false,

      // Status
      status: body.status || 'draft',
      posted_by: user.id,
      published_at: body.status === 'active' ? new Date().toISOString() : null,
    };

    // Insert job offer
    const { data: jobOffer, error: insertError } = await supabase
      .from('job_offers')
      .insert([jobData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting job offer:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Notify external webhook with the created job ID (best-effort)
    try {
      const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.benamara.tn/webhook/autopiahire/add-job';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

      // send only the id to the webhook; include api_key header expected by n8n
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({ job_id: jobOffer?.id }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('Webhook returned non-OK status', res.status, text);
      }
    } catch (hookErr) {
      console.warn('Error calling webhook (non-fatal):', hookErr);
    }

    return NextResponse.json(
      {
        message: 'Job offer created successfully',
        job: jobOffer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating job offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const status = searchParams.get('status');
    const employment_type = searchParams.get('employment_type');
    const is_remote = searchParams.get('is_remote');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('job_offers')
      .select('*')
      .order('published_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'active'); // Default to active jobs
    }

    if (employment_type) {
      query = query.eq('employment_type', employment_type);
    }

    if (is_remote === 'true') {
      query = query.eq('is_remote', true);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
