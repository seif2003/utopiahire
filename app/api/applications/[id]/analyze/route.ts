import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || '')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: applicationId } = await params

    // Fetch application with job and candidate data
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        user_id,
        job_id,
        status,
        applied_at,
        profiles:user_id (
          full_name,
          email,
          headline,
          location,
          bio
        )
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Fetch job details
    const { data: job } = await supabase
      .from('job_offers')
      .select('*')
      .eq('id', application.job_id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if user owns this job
    if (job.posted_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch detailed candidate data
    const [experiences, education, skills, projects, certifications] = await Promise.all([
      supabase.from('experiences').select('*').eq('user_id', application.user_id).order('start_date', { ascending: false }),
      supabase.from('education').select('*').eq('user_id', application.user_id).order('start_year', { ascending: false }),
      supabase.from('skills').select('name').eq('user_id', application.user_id),
      supabase.from('projects').select('name, description').eq('user_id', application.user_id),
      supabase.from('certifications').select('name, year').eq('user_id', application.user_id).order('year', { ascending: false }),
    ])

    const candidate = {
      profile: Array.isArray(application.profiles) ? application.profiles[0] : application.profiles,
      experiences: experiences.data || [],
      education: education.data || [],
      skills: skills.data || [],
      projects: projects.data || [],
      certifications: certifications.data || [],
    }

    // Build AI prompt
    const prompt = `
You are an expert recruiter analyzing a candidate for a specific job. Provide clear, actionable insights.

JOB REQUIREMENTS:
- Title: ${job.title}
- Company: ${job.company_name}
- Required Skills: ${job.required_skills?.join(', ') || 'Not specified'}
- Preferred Skills: ${job.preferred_skills?.join(', ') || 'Not specified'}
- Experience Level: ${job.experience_level}
- Location: ${job.location}

CANDIDATE PROFILE:
Name: ${candidate.profile?.full_name || 'Anonymous'}
Headline: ${candidate.profile?.headline || 'Not specified'}
Location: ${candidate.profile?.location || 'Not specified'}

EXPERIENCE (${candidate.experiences.length} roles):
${candidate.experiences.length > 0 ? candidate.experiences.slice(0, 5).map(exp => 
  `- ${exp.title} at ${exp.company} (${exp.start_date} to ${exp.end_date || 'Present'})${exp.description ? '\n  ' + exp.description.substring(0, 100) : ''}`
).join('\n') : '- No experience listed'}

EDUCATION (${candidate.education.length}):
${candidate.education.length > 0 ? candidate.education.map(edu => 
  `- ${edu.degree} in ${edu.field_of_study} from ${edu.school} (${edu.start_year}-${edu.end_year || 'Present'})`
).join('\n') : '- No education listed'}

SKILLS (${candidate.skills.length}):
${candidate.skills.length > 0 ? candidate.skills.map(s => s.name).join(', ') : 'No skills listed'}

PROJECTS (${candidate.projects.length}):
${candidate.projects.length > 0 ? candidate.projects.slice(0, 3).map(proj => 
  `- ${proj.name}${proj.description ? ': ' + proj.description.substring(0, 100) : ''}`
).join('\n') : '- No projects listed'}

CERTIFICATIONS (${candidate.certifications.length}):
${candidate.certifications.length > 0 ? candidate.certifications.map(cert => 
  `- ${cert.name}${cert.year ? ` (${cert.year})` : ''}`
).join('\n') : '- No certifications listed'}

Return ONLY valid JSON (no markdown):
{
  "quickSummary": "Clear overview of the candidate in 20-25 words",
  "experienceMatch": "How their experience aligns with the role in 15-20 words",
  "skillsMatch": "Assessment of skills alignment in 15-20 words",
  "topStrength": "Their strongest quality or achievement in 10-15 words",
  "potentialConcern": "Any gap or concern to address in 10-15 words, or null if none",
  "interviewQuestions": ["Question 1", "Question 2"],
  "recommendation": "Brief hiring recommendation in 15-20 words"
}

Be specific, objective, and helpful. Focus on fit for this particular role.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    console.log('AI Response for application:', applicationId, responseText) // Debug log
    
    // Clean up the response
    let jsonText = responseText.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    const analysis = JSON.parse(jsonText)

    return NextResponse.json({
      ...analysis,
      candidateName: candidate.profile?.full_name || 'Anonymous',
      analyzedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error analyzing candidate:', error)
    return NextResponse.json(
      { error: 'Failed to analyze candidate' },
      { status: 500 }
    )
  }
}
