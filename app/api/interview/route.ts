import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { getInterviewGeneratorModel, withRetry, parseGeminiJSON } from '@/lib/gemini'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get job_offers_id from query params
    const searchParams = request.nextUrl.searchParams
    const jobOffersId = searchParams.get('job_offers_id')

    if (!jobOffersId) {
      return NextResponse.json(
        { error: 'Missing job_offers_id parameter' },
        { status: 400 }
      )
    }

    // Fetch job details from database
    const { data: job, error: jobError } = await supabase
      .from('job_offers')
      .select('*')
      .eq('id', jobOffersId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Generate interview using Gemini AI
    const model = getInterviewGeneratorModel()
    
    const prompt = `You are an expert technical recruiter and interview designer. Generate a comprehensive, professional AI interview for the following job position.

**Job Details:**
- **Title:** ${job.title}
- **Company:** ${job.company_name}
- **Description:** ${job.description}
- **Required Skills:** ${job.required_skills?.join(', ') || 'N/A'}
- **Preferred Skills:** ${job.preferred_skills?.join(', ') || 'N/A'}
- **Experience Level:** ${job.experience_level}
- **Required Experience Years:** ${job.required_experience_years || 'N/A'}
- **Responsibilities:** ${job.responsibilities?.join('; ') || 'N/A'}
- **Education Requirements:** ${job.education_requirements?.join(', ') || 'N/A'}

**Instructions:**
1. Create 18-25 questions organized into 4-6 logical sections
2. Mix behavioral (soft skills, problem-solving, teamwork) and technical questions
3. Questions should be relevant to the job requirements and experience level
4. Start with easier behavioral questions to build rapport
5. Progress to more technical/challenging questions
6. Each question should be clear, specific, and open-ended
7. Estimated duration: 60-90 minutes total

**Required JSON Output Format:**
\`\`\`json
{
  "job_title": "${job.title}",
  "duration_minutes": 75,
  "sections": [
    {
      "name": "Section Name (e.g., Introduction & Behavioral Questions)",
      "questions": [
        {
          "id": 1,
          "type": "behavioral",
          "question": "Question text here"
        }
      ]
    }
  ]
}
\`\`\`

**Question Type Guidelines:**
- "behavioral": Past experiences, soft skills, work style, problem-solving approaches
- "technical": Domain knowledge, technical skills, tools, frameworks, best practices

Generate a high-quality, relevant interview NOW. Output ONLY the JSON, no additional text.`

    const result = await withRetry(async () => {
      const response = await model.generateContent(prompt)
      return response.response.text()
    })

    // Parse the JSON response
    const interview = parseGeminiJSON<{
      job_title: string
      duration_minutes: number
      sections: Array<{
        name: string
        questions: Array<{
          id: number
          type: string
          question: string
        }>
      }>
    }>(result)

    // Validate the structure
    if (!interview.sections || !Array.isArray(interview.sections)) {
      throw new Error('Invalid interview structure generated')
    }

    return NextResponse.json({
      output: {
        interview
      }
    })
  } catch (error) {
    console.error('Error generating interview:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate interview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
