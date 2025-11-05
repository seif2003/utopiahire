import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_KEY) {
  throw new Error('GEMINI_KEY environment variable is not set')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)

/**
 * Get Gemini model instance with optimal configuration for interview generation
 */
export function getInterviewGeneratorModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8, // Creative but controlled
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  })
}

/**
 * Get Gemini model instance with optimal configuration for evaluation
 */
export function getEvaluatorModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3, // More deterministic for evaluations
      topP: 0.85,
      topK: 20,
      maxOutputTokens: 8192,
    },
  })
}

/**
 * Retry wrapper for Gemini API calls with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * Parse JSON from Gemini response, handling markdown code blocks
 */
export function parseGeminiJSON<T>(text: string): T {
  // Remove markdown code blocks if present
  let cleaned = text.trim()
  
  // Remove ```json or ``` wrapper
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  
  cleaned = cleaned.trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (error) {
    // If parsing fails, try to fix common issues
    console.error('JSON Parse Error:', error)
    console.error('Attempted to parse:', cleaned.substring(0, 500) + '...')
    
    // Try to extract JSON array if response got truncated
    const arrayMatch = cleaned.match(/^\[[\s\S]*\]/m)
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0])
      } catch (e) {
        // Still failed
      }
    }
    
    // If all else fails, throw the original error
    throw new Error(`Failed to parse Gemini JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
