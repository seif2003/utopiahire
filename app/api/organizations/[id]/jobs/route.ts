import { createClient } from '@/lib/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all jobs for a specific organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (organization.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('job_offers')
      .select('*')
      .eq('organization_id', id)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      console.error('Error fetching organization jobs:', jobsError);
      return NextResponse.json(
        { error: jobsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(jobs || []);
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
