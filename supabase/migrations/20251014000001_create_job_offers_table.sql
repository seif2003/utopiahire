-- Create custom types for job offers
CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'freelance', 'internship');
CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'filled');
CREATE TYPE salary_period AS ENUM ('hourly', 'monthly', 'yearly');

-- ====================================
-- JOB OFFERS TABLE
-- ====================================
CREATE TABLE job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company Information
    company_name TEXT NOT NULL,
    company_logo TEXT, -- URL to company logo
    company_website TEXT,
    company_description TEXT,
    
    -- Job Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    responsibilities TEXT[], -- Array of responsibilities
    
    -- Employment Details
    employment_type employment_type NOT NULL,
    experience_level experience_level NOT NULL,
    location TEXT NOT NULL,
    is_remote BOOLEAN DEFAULT false,
    is_hybrid BOOLEAN DEFAULT false,
    
    -- Compensation
    salary_min DECIMAL(10, 2),
    salary_max DECIMAL(10, 2),
    salary_currency TEXT DEFAULT 'USD',
    salary_period salary_period,
    
    -- Requirements
    required_skills TEXT[] NOT NULL, -- Array of required skills
    preferred_skills TEXT[], -- Array of preferred skills
    required_experience_years INTEGER,
    education_requirements TEXT[],
    language_requirements JSONB, -- e.g., [{"language": "en", "proficiency": "fluent"}]
    
    -- Application Details
    application_deadline DATE,
    positions_available INTEGER DEFAULT 1,
    application_url TEXT, -- External application link
    contact_email TEXT,
    
    -- Additional Information
    benefits TEXT[], -- Array of benefits (health insurance, 401k, etc.)
    company_culture TEXT[], -- Array of culture values
    work_schedule TEXT, -- e.g., "Monday-Friday, 9-5"
    relocation_assistance BOOLEAN DEFAULT false,
    visa_sponsorship BOOLEAN DEFAULT false,
    
    -- Status and Metadata
    status job_status DEFAULT 'draft',
    posted_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- If recruiter/company user
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    
    -- Vector Search (for AI matching)
    embedding vector(768), -- For semantic job matching with resumes
    
    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- JOB APPLICATIONS TABLE
-- ====================================
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Application Details
    status TEXT DEFAULT 'submitted', -- submitted, reviewing, interview, rejected, accepted
    cover_letter TEXT,
    resume_url TEXT, -- Specific resume used for this application
    
    -- Matching Score (calculated via vector similarity)
    match_score DECIMAL(5, 2), -- 0-100 score
    
    -- Timestamps
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user can only apply once per job
    UNIQUE(job_id, user_id)
);

-- ====================================
-- SAVED JOBS TABLE (for job seekers to bookmark)
-- ====================================
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notes TEXT, -- Personal notes about the job
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user can only save a job once
    UNIQUE(job_id, user_id)
);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================
CREATE INDEX idx_job_offers_status ON job_offers(status);
CREATE INDEX idx_job_offers_employment_type ON job_offers(employment_type);
CREATE INDEX idx_job_offers_experience_level ON job_offers(experience_level);
CREATE INDEX idx_job_offers_location ON job_offers(location);
CREATE INDEX idx_job_offers_is_remote ON job_offers(is_remote);
CREATE INDEX idx_job_offers_posted_by ON job_offers(posted_by);
CREATE INDEX idx_job_offers_published_at ON job_offers(published_at);
CREATE INDEX idx_job_offers_required_skills ON job_offers USING GIN (required_skills);

-- Index for vector similarity search
CREATE INDEX idx_job_offers_embedding ON job_offers USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);

-- ====================================
-- TRIGGERS FOR UPDATED_AT
-- ====================================
CREATE TRIGGER update_job_offers_updated_at
    BEFORE UPDATE ON job_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- FUNCTION TO MATCH JOBS WITH RESUMES
-- ====================================
CREATE OR REPLACE FUNCTION match_jobs_for_user (
  user_resume_embedding vector(768),
  match_count int DEFAULT 10,
  min_similarity float DEFAULT 0.5
) RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  location TEXT,
  employment_type employment_type,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    job_offers.id,
    job_offers.title,
    job_offers.company_name,
    job_offers.location,
    job_offers.employment_type,
    1 - (job_offers.embedding <=> user_resume_embedding) as similarity
  FROM job_offers
  WHERE 
    job_offers.status = 'active' AND
    job_offers.embedding IS NOT NULL AND
    1 - (job_offers.embedding <=> user_resume_embedding) >= min_similarity
  ORDER BY job_offers.embedding <=> user_resume_embedding
  LIMIT match_count;
END;
$$;

-- ====================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================

-- Enable RLS
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Job Offers Policies
CREATE POLICY "Anyone can view active job offers"
    ON job_offers FOR SELECT
    USING (status = 'active' OR posted_by = auth.uid());

CREATE POLICY "Authenticated users can create job offers"
    ON job_offers FOR INSERT
    TO authenticated
    WITH CHECK (posted_by = auth.uid());

CREATE POLICY "Users can update their own job offers"
    ON job_offers FOR UPDATE
    USING (posted_by = auth.uid());

CREATE POLICY "Users can delete their own job offers"
    ON job_offers FOR DELETE
    USING (posted_by = auth.uid());

-- Job Applications Policies
CREATE POLICY "Users can view their own applications"
    ON job_applications FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM job_offers 
        WHERE job_offers.id = job_applications.job_id 
        AND job_offers.posted_by = auth.uid()
    ));

CREATE POLICY "Users can create their own applications"
    ON job_applications FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own applications"
    ON job_applications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own applications"
    ON job_applications FOR DELETE
    USING (user_id = auth.uid());

-- Saved Jobs Policies
CREATE POLICY "Users can view their own saved jobs"
    ON saved_jobs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can save jobs"
    ON saved_jobs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their saved jobs"
    ON saved_jobs FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their saved jobs"
    ON saved_jobs FOR DELETE
    USING (user_id = auth.uid());

-- ====================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================
COMMENT ON TABLE job_offers IS 'Job postings from companies';
COMMENT ON TABLE job_applications IS 'Applications submitted by users to job offers';
COMMENT ON TABLE saved_jobs IS 'Jobs bookmarked by users';
COMMENT ON COLUMN job_offers.embedding IS 'Vector embedding for AI-powered job matching with user resumes';
COMMENT ON FUNCTION match_jobs_for_user IS 'Find best matching jobs for a user based on resume embedding';
