'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
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

interface AIInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobTitle: string
}

export function AIInterviewDialog({ open, onOpenChange, jobId, jobTitle }: AIInterviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Load interview when dialog opens
  useEffect(() => {
    if (open && !interview) {
      loadInterview()
    }
  }, [open])

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
      onOpenChange(false)
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
        throw new Error('Failed to submit interview')
      }

      setIsComplete(true)
      toast.success('Interview submitted successfully! You will receive your results soon.')
    } catch (error) {
      console.error('Error submitting interview:', error)
      toast.error('Failed to submit interview. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setInterview(null)
    setCurrentSectionIndex(0)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setCurrentAnswer('')
    setIsComplete(false)
    onOpenChange(false)
  }

  const progress = interview ? (getCurrentQuestionNumber() / getTotalQuestions()) * 100 : 0
  const currentQuestion = getCurrentQuestion()
  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion = interview && 
    currentSectionIndex === interview.sections.length - 1 && 
    currentQuestionIndex === interview.sections[currentSectionIndex].questions.length - 1

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading your interview...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
          </div>
        ) : isComplete ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Interview Completed!</h3>
            <p className="text-muted-foreground text-center mb-6">
              Thank you for completing the AI interview. Your responses have been submitted for evaluation.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : interview ? (
          <>
            <DialogHeader>
              <DialogTitle>AI Interview - {interview.job_title}</DialogTitle>
              <DialogDescription>
                Duration: ~{interview.duration_minutes} minutes | Question {getCurrentQuestionNumber()} of {getTotalQuestions()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              {/* Current Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {interview.sections[currentSectionIndex].name}
                  </CardTitle>
                  <CardDescription>
                    Question {currentQuestionIndex + 1} of {interview.sections[currentSectionIndex].questions.length} in this section
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQuestion && (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                          {getCurrentQuestionNumber()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                            {currentQuestion.type} Question
                          </p>
                          <p className="text-lg font-medium leading-relaxed">
                            {currentQuestion.question}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Answer</label>
                        <Textarea
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="min-h-[200px] resize-none"
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                          Take your time to provide a detailed and thoughtful answer.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion || isSubmitting}
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={isSubmitting || !currentAnswer.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : isLastQuestion ? (
                  'Submit Interview'
                ) : (
                  'Next Question'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
