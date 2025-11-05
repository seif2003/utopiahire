'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: number
  type: string
  question: string
}

interface Section {
  name: string
  questions: Question[]
}

interface Interview {
  job_title: string
  duration_minutes: number
  sections: Section[]
}

interface InterviewResponse {
  output: {
    interview: Interview
  }
}

export default function InterviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const jobTitle = searchParams.get('jobTitle')

  const [isLoading, setIsLoading] = useState(true)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [evaluationResults, setEvaluationResults] = useState<Record<number, any> | null>(null)

  useEffect(() => {
    if (!jobId) {
      toast.error('Missing job ID')
      router.push('/main/jobs')
      return
    }
    loadInterview()
  }, [jobId])

  const loadInterview = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/interview?job_offers_id=${jobId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load interview')
      }

      const data: InterviewResponse = await response.json()
      setInterview(data.output.interview)
      toast.success('Interview loaded successfully!')
    } catch (error) {
      console.error('Error loading interview:', error)
      toast.error('Failed to load interview. Please try again.')
      router.push('/main/jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalQuestions = () => {
    if (!interview) return 0
    return interview.sections.reduce((total, section) => total + section.questions.length, 0)
  }

  const getCurrentQuestionNumber = () => {
    if (!interview) return 0
    let count = 0
    for (let i = 0; i < currentSectionIndex; i++) {
      count += interview.sections[i].questions.length
    }
    return count + currentQuestionIndex + 1
  }

  const getCurrentQuestion = () => {
    if (!interview) return null
    return interview.sections[currentSectionIndex]?.questions[currentQuestionIndex]
  }

  const handleNext = () => {
    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) return

    // Save current answer
    if (currentAnswer.trim()) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: currentAnswer }))
    } else {
      toast.error('Please provide an answer before proceeding')
      return
    }

    const currentSection = interview!.sections[currentSectionIndex]
    
    // Move to next question
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer('')
    } else if (currentSectionIndex < interview!.sections.length - 1) {
      // Move to next section
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
      setCurrentAnswer('')
    } else {
      // Interview complete
      handleSubmitInterview()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      const prevQuestion = interview!.sections[currentSectionIndex].questions[currentQuestionIndex - 1]
      setCurrentAnswer(answers[prevQuestion.id] || '')
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
      const prevSection = interview!.sections[currentSectionIndex - 1]
      setCurrentQuestionIndex(prevSection.questions.length - 1)
      const prevQuestion = prevSection.questions[prevSection.questions.length - 1]
      setCurrentAnswer(answers[prevQuestion.id] || '')
    }
  }

  const handleSubmitInterview = async () => {
    const currentQuestion = getCurrentQuestion()
    if (currentQuestion && currentAnswer.trim()) {
      answers[currentQuestion.id] = currentAnswer
    }

    setIsSubmitting(true)
    
    try {
      // Prepare the data to send to the evaluation API
      const evaluationData = {
        job_title: interview!.job_title,
        responses: interview!.sections.flatMap(section =>
          section.questions.map(question => ({
            question_id: question.id,
            question: question.question,
            type: question.type,
            answer: answers[question.id] || '',
            section: section.name
          }))
        )
      }

      const response = await fetch(`/api/evaluate-interview?job_offers_id=${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('evaluate error:', errorText)
        throw new Error('Failed to submit interview')
      }

      const data = await response.json()

      // n8n returns an array with an object that has `output` array
      // normalize to a map: { question_id: ai_feedback }
      let outputs: any[] = []
      if (Array.isArray(data)) {
        // try first element
        outputs = data[0]?.output || data[0] || []
      } else if (data?.output) {
        outputs = data.output
      } else {
        outputs = data
      }

      const resultsMap: Record<number, any> = {}
      if (Array.isArray(outputs)) {
        for (const item of outputs) {
          if (item?.question_id != null) {
            resultsMap[Number(item.question_id)] = item.ai_feedback || item
          }
        }
      }

      setEvaluationResults(resultsMap)
      setIsComplete(true)
      toast.success('Interview submitted successfully! You will receive your results soon.')
    } catch (error) {
      console.error('Error submitting interview:', error)
      toast.error('Failed to submit interview. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = interview ? (getCurrentQuestionNumber() / getTotalQuestions()) * 100 : 0
  const currentQuestion = getCurrentQuestion()
  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion = interview && 
    currentSectionIndex === interview.sections.length - 1 && 
    currentQuestionIndex === interview.sections[currentSectionIndex].questions.length - 1

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading your interview...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="pt-24 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-start justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Detailed feedback per question */}
          <div className="space-y-6">
            {interview!.sections.map((section, sIdx) => (
              <Card key={sIdx} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <CardTitle className="text-xl">{section.name}</CardTitle>
                  <CardDescription>{section.questions.length} questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {section.questions.map((q) => {
                    const feedback = evaluationResults ? evaluationResults[q.id] : null
                    const userAnswer = answers[q.id] || '(No answer provided)'
                    
                    return (
                      <div key={q.id} className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0">
                        {/* Question Header */}
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                            {q.id}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                                {q.type}
                              </span>
                            </div>
                            <p className="text-base font-semibold leading-relaxed text-gray-900">
                              {q.question}
                            </p>
                          </div>
                        </div>

                        {/* User's Answer */}
                        <div className="ml-14 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                            <p className="text-sm font-semibold text-gray-700">Your Answer</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {userAnswer}
                            </p>
                          </div>
                        </div>

                        {/* AI Feedback */}
                        <div className="ml-14 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                            <p className="text-sm font-semibold text-gray-700">AI Evaluation</p>
                          </div>
                          
                          {/* Summary */}
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-purple-900">
                              {feedback?.evaluation_summary || 'No feedback available.'}
                            </p>
                          </div>

                          {/* Detailed Feedback */}
                          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Detailed Feedback
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {feedback?.detailed_feedback || 'No detailed feedback available.'}
                            </p>
                          </div>

                          {/* Improvement Advice */}
                          {Array.isArray(feedback?.improvement_advice) && feedback.improvement_advice.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                                💡 Improvement Tips
                              </p>
                              <ul className="space-y-1.5">
                                {feedback.improvement_advice.map((advice: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    <span className="flex-1">{advice}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!interview) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold">{interview.job_title}</h1>
              <p className="text-sm text-muted-foreground">
                AI Interview • ~{interview.duration_minutes} minutes
              </p>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {getCurrentQuestionNumber()} of {getTotalQuestions()}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">
                    {interview.sections[currentSectionIndex].name}
                  </CardTitle>
                  <CardDescription>
                    Question {currentQuestionIndex + 1} of {interview.sections[currentSectionIndex].questions.length} in this section
                  </CardDescription>
                </div>
                <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  {getCurrentQuestionNumber()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
                        {currentQuestion.type} Question
                      </span>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-primary">
                      <p className="text-lg leading-relaxed">
                        {currentQuestion.question}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Your Answer</label>
                    <Textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer here... Be detailed and thoughtful in your response."
                      className="min-h-[300px] resize-none text-base"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Take your time to provide a comprehensive answer. Quality matters more than speed.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={isFirstQuestion || isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              disabled={isSubmitting || !currentAnswer.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : isLastQuestion ? (
                'Submit Interview'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
