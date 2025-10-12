-- Create custom types for enums
CREATE TYPE work_preference_type AS ENUM ('full-time', 'part-time', 'freelance', 'remote');
CREATE TYPE visibility_mode_type AS ENUM ('public', 'anonymous');
CREATE TYPE skill_level_type AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE language_proficiency_type AS ENUM ('beginner', 'intermediate', 'fluent', 'native');

-- ====================================
-- PROFILES TABLE
-- ====================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    headline TEXT,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    location TEXT,
    profile_picture TEXT,
    bio TEXT,
    work_preference work_preference_type,
    visibility_mode visibility_mode_type DEFAULT 'public',
    resume TEXT, -- URL to stored resume
    first_login BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- EXPERIENCES TABLE
-- ====================================
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL means still working
    description TEXT,
    proof_link TEXT, -- Optional GitHub, portfolio, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- EDUCATION TABLE
-- ====================================
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- SKILLS TABLE
-- ====================================
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT, -- e.g., "Programming", "Soft Skill"
    level skill_level_type DEFAULT 'beginner',
    verified BOOLEAN DEFAULT false, -- True if proven by project/test
    verification_source TEXT, -- Optional test/certificate link
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- PROJECTS TABLE
-- ====================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    tech_stack TEXT[], -- Array of tools
    role TEXT, -- What the user did
    links TEXT[], -- URLs (GitHub, Live Demo, etc.)
    impact TEXT, -- Results / Achievements
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- CERTIFICATIONS TABLE
-- ====================================
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    year INTEGER NOT NULL,
    credential_url TEXT, -- Proof link
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- LANGUAGES TABLE
-- ====================================
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    language TEXT NOT NULL, -- ISO 639 e.g., "en"
    proficiency language_proficiency_type DEFAULT 'beginner',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- VALUES AND PREFERENCES TABLE
-- ====================================
CREATE TABLE values_and_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    core_values TEXT[], -- e.g., ["innovation", "teamwork"]
    preferred_culture TEXT[], -- e.g., ["remote-first", "inclusive"]
    open_to_relocation BOOLEAN DEFAULT false,
    desired_industries TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================
CREATE INDEX idx_experiences_user_id ON experiences(user_id);
CREATE INDEX idx_education_user_id ON education(user_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_languages_user_id ON languages(user_id);
CREATE INDEX idx_values_preferences_user_id ON values_and_preferences(user_id);

-- Index for searching profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_visibility_mode ON profiles(visibility_mode);

-- ====================================
-- TRIGGERS FOR UPDATED_AT
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
    BEFORE UPDATE ON experiences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at
    BEFORE UPDATE ON education
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_languages_updated_at
    BEFORE UPDATE ON languages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_values_preferences_updated_at
    BEFORE UPDATE ON values_and_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE values_and_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view public profiles"
    ON profiles FOR SELECT
    USING (visibility_mode = 'public' OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

-- Experiences policies
CREATE POLICY "Users can view their own experiences"
    ON experiences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiences"
    ON experiences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences"
    ON experiences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiences"
    ON experiences FOR DELETE
    USING (auth.uid() = user_id);

-- Education policies
CREATE POLICY "Users can view their own education"
    ON education FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education"
    ON education FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education"
    ON education FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education"
    ON education FOR DELETE
    USING (auth.uid() = user_id);

-- Skills policies
CREATE POLICY "Users can view their own skills"
    ON skills FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
    ON skills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
    ON skills FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
    ON skills FOR DELETE
    USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Certifications policies
CREATE POLICY "Users can view their own certifications"
    ON certifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certifications"
    ON certifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications"
    ON certifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications"
    ON certifications FOR DELETE
    USING (auth.uid() = user_id);

-- Languages policies
CREATE POLICY "Users can view their own languages"
    ON languages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own languages"
    ON languages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own languages"
    ON languages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own languages"
    ON languages FOR DELETE
    USING (auth.uid() = user_id);

-- Values and preferences policies
CREATE POLICY "Users can view their own values and preferences"
    ON values_and_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own values and preferences"
    ON values_and_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own values and preferences"
    ON values_and_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own values and preferences"
    ON values_and_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- ====================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================
COMMENT ON TABLE profiles IS 'User profile information';
COMMENT ON TABLE experiences IS 'User work experiences';
COMMENT ON TABLE education IS 'User education history';
COMMENT ON TABLE skills IS 'User skills with verification status';
COMMENT ON TABLE projects IS 'User projects and portfolio items';
COMMENT ON TABLE certifications IS 'User certifications and credentials';
COMMENT ON TABLE languages IS 'Languages spoken by user';
COMMENT ON TABLE values_and_preferences IS 'User values, culture preferences, and job preferences';
