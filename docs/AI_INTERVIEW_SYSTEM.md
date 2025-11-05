# AI Interview System - Gemini Implementation

## Overview

This implementation replaces the n8n webhook dependency with a native Next.js + Gemini AI solution for generating and evaluating job interviews.

## Architecture

### Core Components

1. **`lib/gemini.ts`** - Gemini AI configuration and utilities
   - Model configurations optimized for generation vs evaluation
   - Retry logic with exponential backoff
   - JSON parsing with markdown code block handling

2. **`app/api/interview/route.ts`** - Interview Generation
   - Fetches job details from Supabase
   - Generates personalized interview questions using Gemini
   - Returns structured JSON format

3. **`app/api/evaluate-interview/route.ts`** - Response Evaluation
   - Evaluates candidate answers using Gemini
   - Provides detailed feedback per question
   - Includes improvement advice and example answers

## Features

### Interview Generation
- **Dynamic Question Creation**: 18-25 questions tailored to job requirements
- **Logical Sections**: 4-6 themed sections (behavioral, technical, domain-specific)
- **Question Types**: Mix of behavioral and technical questions
- **Progressive Difficulty**: Easier questions first, building to complex topics
- **Job-Aware**: Uses job title, skills, experience level, responsibilities

### Evaluation Quality
- **Context-Aware**: Considers job requirements and experience level
- **Comprehensive Feedback**: Summary, detailed analysis, improvement tips
- **Constructive Tone**: Encouraging even for weak answers
- **Actionable Advice**: Specific, practical improvement suggestions
- **Example Answers**: Provides better answer examples when needed

## Configuration

### Model Settings

**Interview Generation** (`getInterviewGeneratorModel`)
- Model: `gemini-1.5-pro`
- Temperature: `0.8` (creative but controlled)
- Top P: `0.95`
- Top K: `40`
- Max Tokens: `8192`

**Evaluation** (`getEvaluatorModel`)
- Model: `gemini-1.5-pro`
- Temperature: `0.3` (deterministic and consistent)
- Top P: `0.85`
- Top K: `20`
- Max Tokens: `8192`

### Retry Strategy
- Max Retries: 3 attempts
- Base Delay: 1000ms
- Exponential Backoff: 2x multiplier
- Evaluation: Extended to 2000ms base delay

## API Endpoints

### GET `/api/interview?job_offers_id={id}`

Generates interview questions for a job.

**Response Format:**
```json
{
  "output": {
    "interview": {
      "job_title": "Backend Developer",
      "duration_minutes": 75,
      "sections": [
        {
          "name": "Introduction & Behavioral Questions",
          "questions": [
            {
              "id": 1,
              "type": "behavioral",
              "question": "Tell us about a challenging project..."
            }
          ]
        }
      ]
    }
  }
}
```

### POST `/api/evaluate-interview?job_offers_id={id}`

Evaluates candidate responses.

**Request Body:**
```json
{
  "job_title": "Backend Developer",
  "responses": [
    {
      "question_id": 1,
      "question": "Question text",
      "type": "behavioral",
      "answer": "Candidate answer",
      "section": "Introduction & Behavioral Questions"
    }
  ]
}
```

**Response Format:**
```json
[
  {
    "output": [
      {
        "question_id": 1,
        "ai_feedback": {
          "evaluation_summary": "Brief summary",
          "detailed_feedback": "Detailed analysis",
          "improvement_advice": [
            "Tip 1",
            "Tip 2"
          ],
          "improved_example_answer": "Example improved answer"
        }
      }
    ]
  }
]
```

## Prompt Engineering

### Interview Generation Prompt
- Clear role definition (expert technical recruiter)
- Comprehensive job context
- Specific instructions for question count and organization
- Explicit JSON schema with examples
- Question type guidelines
- Quality expectations

### Evaluation Prompt
- Expert interviewer and coach persona
- Full job context for relevance
- Clear evaluation criteria
- Structured feedback requirements
- Tone guidelines (constructive, encouraging)
- JSON schema enforcement

## Quality Improvements Over n8n

1. **Dynamic Context**: Uses actual job data from database
2. **Better Prompts**: Detailed instructions for high-quality output
3. **Structured Output**: Enforced JSON schema with validation
4. **Error Handling**: Retry logic and graceful degradation
5. **Type Safety**: Full TypeScript typing
6. **Cost Efficiency**: Direct API calls, no webhook overhead
7. **Customizable**: Easy to adjust model parameters and prompts
8. **Maintainable**: Clear separation of concerns

## Environment Variables

```bash
GEMINI_KEY=your_gemini_api_key_here
```

## Usage Example

```typescript
// Generate interview
const response = await fetch('/api/interview?job_offers_id=123')
const { output: { interview } } = await response.json()

// Evaluate responses
const evaluation = await fetch('/api/evaluate-interview?job_offers_id=123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_title: 'Backend Developer',
    responses: [/* ... */]
  })
})
```

## Performance

- **Generation Time**: ~5-15 seconds
- **Evaluation Time**: ~10-30 seconds (depends on answer count)
- **Token Usage**: ~2000-5000 tokens per request
- **Cost**: ~$0.01-0.05 per interview cycle (generation + evaluation)

## Future Enhancements

1. **Caching**: Cache generated interviews per job
2. **Streaming**: Stream responses for faster perceived performance
3. **Analytics**: Track evaluation metrics and improvements
4. **Fine-tuning**: Custom model training on company-specific data
5. **Multi-language**: Support for non-English interviews
6. **Difficulty Levels**: Adaptive questioning based on answer quality
7. **Skills Assessment**: Automatic skill level scoring
8. **Comparison**: Compare candidates across same job

## Troubleshooting

### Empty Response
- Check `GEMINI_KEY` is set correctly
- Verify API quota hasn't been exceeded
- Check console logs for detailed errors

### JSON Parse Errors
- `parseGeminiJSON` handles markdown blocks
- Retry logic handles transient failures
- Validate response structure in logs

### Poor Quality Output
- Adjust temperature (lower = more focused)
- Refine prompts for specific needs
- Increase `maxOutputTokens` for longer responses

## Migration Notes

This implementation is a **drop-in replacement** for the n8n webhooks:
- Same API endpoint paths
- Same response formats
- No frontend changes required
- Better performance and reliability
