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

    const { id: jobId } = await params

    // Fetch job details
    const { data: job } = await supabase
      .from('job_offers')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if user owns this job
    if (job.posted_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch all applications with full candidate data
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        user_id,
        status,
        applied_at,
        match_score,
        profiles:user_id (
          full_name,
          email,
          headline,
          location,
          bio
        )
      `)
      .eq('job_id', jobId)

    console.log('Applications query result:', { applications, appError, jobId }) // Debug log
    console.log('Found applications:', applications?.length) // Debug log
    
    if (!applications || applications.length === 0) {
      return NextResponse.json({ 
        poolOverview: 'No applications received yet for this position.',
        insights: []
      })
    }

    // Process candidates in batches of 2
    const BATCH_SIZE = 2
    const totalBatches = Math.ceil(applications.length / BATCH_SIZE)
    
    console.log(`Processing ${applications.length} candidates in ${totalBatches} batches of ${BATCH_SIZE}`)

    const allInsights: any[] = []
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE
      const endIdx = Math.min(startIdx + BATCH_SIZE, applications.length)
      const batchApplications = applications.slice(startIdx, endIdx)
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (candidates ${startIdx + 1}-${endIdx})`)

      // Fetch detailed data for each candidate in this batch
      const candidatesData = await Promise.all(
        batchApplications.map(async (app) => {
          const [experiences, education, skills, projects, certifications] = await Promise.all([
            supabase.from('experiences').select('*').eq('user_id', app.user_id),
            supabase.from('education').select('*').eq('user_id', app.user_id),
            supabase.from('skills').select('name').eq('user_id', app.user_id),
            supabase.from('projects').select('name, description').eq('user_id', app.user_id),
            supabase.from('certifications').select('name, year').eq('user_id', app.user_id),
          ])

          return {
            applicationId: app.id,
            profile: Array.isArray(app.profiles) ? app.profiles[0] : app.profiles,
            experiences: experiences.data || [],
            education: education.data || [],
            skills: skills.data || [],
            projects: projects.data || [],
            certifications: certifications.data || [],
            currentStatus: app.status,
            appliedAt: app.applied_at
          }
        })
      )

      // Build AI prompt for this batch
      const prompt = `
You are an expert recruiter. Provide SHORT, focused insights for each candidate. Be concise and actionable.

JOB REQUIREMENTS:
- Title: ${job.title}
- Required Skills: ${job.required_skills?.join(', ') || 'Not specified'}
- Experience Level: ${job.experience_level}

CANDIDATES (${candidatesData.length}):
${candidatesData.map((candidate, idx) => `
CANDIDATE ${idx + 1}: ${candidate.profile?.full_name || 'Anonymous'}
Headline: ${candidate.profile?.headline || 'N/A'}
Experience: ${candidate.experiences.length} roles${candidate.experiences.length > 0 ? ` - Latest: ${candidate.experiences[0].title} at ${candidate.experiences[0].company}` : ''}
Education: ${candidate.education.length > 0 ? `${candidate.education[0].degree} in ${candidate.education[0].field_of_study}` : 'N/A'}
Skills: ${candidate.skills.map(s => s.name).slice(0, 5).join(', ')}${candidate.skills.length > 5 ? ` +${candidate.skills.length - 5} more` : ''}
`).join('\n')}

Return ONLY valid JSON (no markdown):
{
  "insights": [
    {
      "candidateIndex": 1,
      "name": "Name",
      "quickSummary": "One clear sentence about the candidate (20-25 words)",
      "experienceMatch": "Brief assessment of experience relevance (15-20 words)",
      "skillsMatch": "How their skills align with role requirements (15-20 words)",
      "topStrength": "Their strongest quality or achievement (10-15 words)",
      "oneQuestion": "One insightful interview question to ask"
    }
  ]
}

Be informative and specific. Focus on job fit and key differentiators.`

      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        
        // Clean up the response
        let jsonText = responseText.trim()
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        
        const batchAnalysis = JSON.parse(jsonText)

        // Add application IDs and profiles
        const batchInsights = batchAnalysis.insights.map((insight: any) => ({
          ...insight,
          applicationId: candidatesData[insight.candidateIndex - 1]?.applicationId,
          profile: candidatesData[insight.candidateIndex - 1]?.profile
        }))

        allInsights.push(...batchInsights)
      } catch (error) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error)
        // Continue with next batch even if one fails
      }
    }

    // Generate overall pool overview
    const poolOverview = `Analyzed ${applications.length} candidate${applications.length > 1 ? 's' : ''}. Review individual insights below for detailed analysis.`

    return NextResponse.json({
      insights: allInsights,
      poolOverview,
      metadata: {
        totalCandidates: applications.length,
        analyzedCandidates: allInsights.length,
        isLimited: false
      }
    })
  } catch (error) {
    console.error('Error analyzing candidates:', error)
    return NextResponse.json(
      { error: 'Failed to analyze candidates' },
      { status: 500 }
    )
  }
}
