export interface Profile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  location?: string
  title?: string
  headline?: string
  bio?: string
  profile_picture?: string
  resume_url?: string
  resume_latex?: string
  is_resume_latex: boolean
  created_at: string
  updated_at: string
}

export interface Experience {
  id: string
  user_id: string
  title: string
  company: string
  position?: string
  start_date: string
  end_date?: string
  description?: string
  is_current: boolean
  created_at: string
}

export interface Education {
  id: string
  user_id: string
  school: string
  institution?: string
  degree: string
  field_of_study: string
  start_date?: string
  end_date?: string
  start_year?: string
  end_year?: string
  description?: string
  created_at: string
}

export interface Skill {
  id: string
  user_id: string
  name: string
  proficiency?: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  title?: string
  description: string
  url?: string
  start_date: string
  end_date?: string
  created_at: string
}

export interface Certification {
  id: string
  user_id: string
  name: string
  issuer: string
  issue_date?: string
  year?: string
  expiry_date?: string
  url?: string
  created_at: string
}

export interface Language {
  id: string
  user_id: string
  language: string
  proficiency: string
  created_at: string
}

export interface ValuesAndPreferences {
  id: string
  user_id: string
  work_environment?: string
  company_size?: string
  industry_preferences?: string[]
  role_preferences?: string[]
  location_preferences?: string[]
  remote_preference?: string
  salary_expectation?: string
  benefits_priorities?: string[]
  career_goals?: string
  created_at: string
  updated_at: string
}

export interface JobApplication {
  id: string
  user_id: string
  job_id: string
  status: string
  applied_at: string
  job_offers?: {
    id: string
    title: string
    company: string
    company_name?: string
    location?: string
    employment_type?: string
  }
}
