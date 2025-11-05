import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { getEvaluatorModel, withRetry, parseGeminiJSON } from '@/lib/gemini'

interface QuestionResponse {
  question_id: number
  question: string
  type: string
  answer: string
  section: string
}

interface EvaluationRequest {
  job_title: string
  responses: QuestionResponse[]
}

export async function POST(request: NextRequest) {
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

    // Get the evaluation data from request body
    const body: EvaluationRequest = await request.json()

    if (!body.responses || !Array.isArray(body.responses)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Fetch job details for context
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

    // Generate evaluation using Gemini AI
    const model = getEvaluatorModel()
    
    const prompt = `You are an expert technical interviewer evaluating candidate responses for a ${body.job_title} position.

**Job Context:**
- Title: ${job.title}
- Experience Level: ${job.experience_level}
- Required Skills: ${job.required_skills?.slice(0, 10).join(', ') || 'N/A'}

**Instructions:**
Evaluate each response and provide CONCISE feedback. Keep all text SHORT and FOCUSED.

**Responses to Evaluate:**
${body.responses.map((r, i) => `
Q${r.question_id} [${r.type}]: ${r.question}
A: ${r.answer || '(No answer)'}
`).join('\n')}

**Output JSON (REQUIRED FORMAT - Be concise):**
[
  {
    "question_id": 1,
    "ai_feedback": {
      "evaluation_summary": "Brief 10-15 word summary",
      "detailed_feedback": "30-50 word analysis",
      "improvement_advice": ["Tip 1 (short)", "Tip 2 (short)"]
    }
  }
]

CRITICAL: 
- Keep ALL text SHORT and CONCISE
- evaluation_summary: MAX 15 words
- detailed_feedback: MAX 50 words  
- improvement_advice: 2-3 tips, each MAX 10 words
- Output ONLY valid JSON, nothing else
- Do NOT include improved_example_answer field`

    const result = await withRetry(async () => {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.85,
          topK: 20,
          maxOutputTokens: 4096, // Reduced for more reliable output
          responseMimeType: 'application/json' // Request JSON format
        }
      })
      return response.response.text()
    }, 3, 2000) // More retries with longer delays for evaluation

    console.log('=== Gemini Response ===')
    console.log('Length:', result.length)
    console.log('First 500 chars:', result.substring(0, 500))
    console.log('Last 500 chars:', result.substring(result.length - 500))
    console.log('======================')

    // Parse the JSON response
    let evaluations: Array<{
      question_id: number
      ai_feedback: {
        evaluation_summary: string
        detailed_feedback: string
        improvement_advice: string[]
        improved_example_answer?: string
      }
    }>

    try {
      evaluations = parseGeminiJSON(result)
      
      // Validate the structure
      if (!Array.isArray(evaluations)) {
        throw new Error('Invalid evaluation structure generated')
      }
      
      console.log('Successfully parsed', evaluations.length, 'evaluations')
    } catch (parseError) {
      console.error('Failed to parse evaluation JSON:', parseError)
      console.error('Raw response length:', result.length)
      console.error('Raw response preview:', result.substring(0, 1000))
      
      // Fallback: Create generic feedback for all questions
      evaluations = body.responses.map(r => ({
        question_id: r.question_id,
        ai_feedback: {
          evaluation_summary: 'Evaluation temporarily unavailable',
          detailed_feedback: 'We encountered an issue processing your response. Please try again.',
          improvement_advice: ['Please resubmit your interview for detailed feedback']
        }
      }))
    }

    // Return in the format the frontend expects
    return NextResponse.json([
      {
        output: evaluations
      }
    ])
  } catch (error) {
    console.error('Error evaluating interview:', error)
    return NextResponse.json(
      { 
        error: 'Failed to evaluate interview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
