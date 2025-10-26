-- ====================================
-- ORGANIZATIONS TABLE
-- ====================================
-- This table stores company/organization information
-- Users can create organizations and then add jobs under them

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization Details
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    industry TEXT, -- e.g., "Technology", "Healthcare", "Finance"
    size TEXT, -- e.g., "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
    founded_year INTEGER,
    
    -- Contact Information
    contact_email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    
    -- Branding
    logo_url TEXT, -- URL to company logo in storage
    cover_image_url TEXT, -- URL to cover/banner image
    
    -- Social Media & Links
    linkedin_url TEXT,
    twitter_url TEXT,
    facebook_url TEXT,
    
    -- Additional Information
    company_culture TEXT[], -- Array of culture values
    benefits TEXT[], -- Array of standard company benefits
    
    -- Ownership & Status
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT false, -- For future verification process
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_website CHECK (website IS NULL OR website ~* '^https?://'),
    CONSTRAINT valid_email CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ====================================
-- ORGANIZATION MEMBERS TABLE
-- ====================================
-- For future multi-user organization management

CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'recruiter', 'member');

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role organization_role DEFAULT 'member',
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, user_id)
);

-- ====================================
-- UPDATE JOB OFFERS TABLE
-- ====================================
-- Add organization reference to job_offers and make company fields optional

ALTER TABLE job_offers 
    ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    ALTER COLUMN company_name DROP NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_job_offers_organization_id ON job_offers(organization_id);

-- ====================================
-- INDEXES
-- ====================================

CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
-- Anyone can view active organizations
CREATE POLICY "Organizations are viewable by everyone" 
    ON organizations FOR SELECT 
    USING (is_active = true);

-- Users can create their own organizations
CREATE POLICY "Users can create organizations" 
    ON organizations FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- Users can update their own organizations
CREATE POLICY "Users can update their own organizations" 
    ON organizations FOR UPDATE 
    USING (auth.uid() = owner_id);

-- Users can delete their own organizations
CREATE POLICY "Users can delete their own organizations" 
    ON organizations FOR DELETE 
    USING (auth.uid() = owner_id);

-- Organization Members Policies
-- Members can view their organization memberships
CREATE POLICY "Users can view their organization memberships" 
    ON organization_members FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE organizations.id = organization_members.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

-- Organization owners can add members
CREATE POLICY "Organization owners can add members" 
    ON organization_members FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE organizations.id = organization_members.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

-- Organization owners can update memberships
CREATE POLICY "Organization owners can update memberships" 
    ON organization_members FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE organizations.id = organization_members.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

-- Organization owners can remove members
CREATE POLICY "Organization owners can remove members" 
    ON organization_members FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE organizations.id = organization_members.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

-- ====================================
-- FUNCTIONS
-- ====================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for organizations
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- Trigger for organization_members
CREATE TRIGGER set_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- ====================================
-- UPDATE JOB OFFERS RLS
-- ====================================

-- Update job offers policies to consider organization membership
-- Drop existing policy if it exists and recreate with organization support
DROP POLICY IF EXISTS "Users can create job offers" ON job_offers;

CREATE POLICY "Users can create job offers" 
    ON job_offers FOR INSERT 
    WITH CHECK (
        auth.uid() = posted_by 
        AND (
            organization_id IS NULL 
            OR 
            EXISTS (
                SELECT 1 FROM organizations 
                WHERE organizations.id = job_offers.organization_id 
                AND organizations.owner_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can update their job offers" ON job_offers;

CREATE POLICY "Users can update their job offers" 
    ON job_offers FOR UPDATE 
    USING (
        auth.uid() = posted_by 
        OR 
        (
            organization_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM organizations 
                WHERE organizations.id = job_offers.organization_id 
                AND organizations.owner_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can delete their job offers" ON job_offers;

CREATE POLICY "Users can delete their job offers" 
    ON job_offers FOR DELETE 
    USING (
        auth.uid() = posted_by 
        OR 
        (
            organization_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM organizations 
                WHERE organizations.id = job_offers.organization_id 
                AND organizations.owner_id = auth.uid()
            )
        )
    );

-- ====================================
-- COMMENTS
-- ====================================

COMMENT ON TABLE organizations IS 'Stores company/organization information for employers';
COMMENT ON TABLE organization_members IS 'Manages multi-user access to organizations';
COMMENT ON COLUMN job_offers.organization_id IS 'Links job offer to an organization. If NULL, uses legacy company_name field';
