import { createClient } from '@/lib/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all organizations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch organizations owned by the user
    const { data: organizations, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching organizations:', fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(organizations || []);
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Prepare organization data
    const organizationData = {
      name: body.name,
      description: body.description || null,
      website: body.website || null,
      industry: body.industry || null,
      size: body.size || null,
      founded_year: body.founded_year || null,
      contact_email: body.contact_email || null,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || null,
      logo_url: body.logo_url || null,
      cover_image_url: body.cover_image_url || null,
      linkedin_url: body.linkedin_url || null,
      twitter_url: body.twitter_url || null,
      facebook_url: body.facebook_url || null,
      company_culture: body.company_culture || [],
      benefits: body.benefits || [],
      owner_id: user.id,
      is_active: true,
    };

    // Insert organization
    const { data: organization, error: insertError } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating organization:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
