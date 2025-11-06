import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: experiences } = await supabase
      .from('experiences')
      .select('*')
      .eq('user_id', user.id)

    const { data: education } = await supabase
      .from('education')
      .select('*')
      .eq('user_id', user.id)

    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', user.id)

    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)

    const { data: certifications } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', user.id)

    const { data: languages } = await supabase
      .from('languages')
      .select('*')
      .eq('user_id', user.id)

    const { data: preferences } = await supabase
      .from('values_and_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: applications } = await supabase
      .from('job_applications')
      .select('*, jobs(*)')
      .eq('user_id', user.id)

    // Build context for AI
    const profileContext = `
User Profile Analysis Request:

BASIC INFO:
- Name: ${profile?.full_name || 'Not provided'}
- Title: ${profile?.title || 'Not provided'}
- Location: ${profile?.location || 'Not provided'}

EXPERIENCE:
${experiences?.length ? experiences.map(exp => `- ${exp.title} at ${exp.company} (${exp.start_date} to ${exp.end_date || 'Present'})`).join('\n') : 'No experience added'}

EDUCATION:
${education?.length ? education.map(edu => `- ${edu.degree} in ${edu.field_of_study} from ${edu.school} (${edu.start_year}-${edu.end_year || 'Present'})`).join('\n') : 'No education added'}

SKILLS:
${skills?.length ? skills.map(skill => `- ${skill.name} (${skill.category})`).join('\n') : 'No skills added'}

PROJECTS:
${projects?.length ? projects.map(proj => `- ${proj.name}: ${proj.description}`).join('\n') : 'No projects added'}

CERTIFICATIONS:
${certifications?.length ? certifications.map(cert => `- ${cert.name} (${cert.year})`).join('\n') : 'No certifications added'}

LANGUAGES:
${languages?.length ? languages.map(lang => `- ${lang.name} (${lang.proficiency})`).join('\n') : 'No languages added'}

PREFERENCES:
- Work Environment: ${preferences?.work_environment || 'Not specified'}
- Company Size: ${preferences?.company_size || 'Not specified'}
- Career Goals: ${preferences?.career_goals || 'Not specified'}

JOB APPLICATIONS:
${applications?.length ? `${applications.length} applications submitted` : 'No applications yet'}

Provide a SHORT, CONCISE profile analysis in this EXACT format:

## 🎯 Profile Score: [X]/5 ⭐
[One sentence explaining the score]

## 💪 Top Strengths
• [Strength 1 - one line]
• [Strength 2 - one line]
• [Strength 3 - one line]

## 🎯 Quick Wins
• [Actionable tip 1 - one line]
• [Actionable tip 2 - one line]
• [Actionable tip 3 - one line]

## 🚀 Next Steps
[2-3 sentences about career trajectory and what to focus on]

Keep it brief, encouraging, and actionable. Use emojis. Maximum 150 words total.
`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(profileContext)
    const feedback = result.response.text()

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error generating profile feedback:', error)
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    )
  }
}
