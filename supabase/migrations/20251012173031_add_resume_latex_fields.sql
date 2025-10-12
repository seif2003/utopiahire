-- Add resume_latex and is_resume_latex fields to profiles table

ALTER TABLE profiles 
ADD COLUMN resume_latex TEXT,
ADD COLUMN is_resume_latex BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.resume_latex IS 'LaTeX source code for the resume';
COMMENT ON COLUMN profiles.is_resume_latex IS 'Indicates if the resume was created using LaTeX';
