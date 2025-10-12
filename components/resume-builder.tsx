'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BasicInfoStep } from './resume-steps/basic-info-step'
import { ExperienceStep } from './resume-steps/experience-step'
import { EducationStep } from './resume-steps/education-step'
import { SkillsStep } from './resume-steps/skills-step'
import { ProjectsStep } from './resume-steps/projects-step'
import { CertificationsStep } from './resume-steps/certifications-step'
import { LanguagesStep } from './resume-steps/languages-step'
import { ValuesPreferencesStep } from './resume-steps/values-preferences-step'


interface ResumeBuilderProps {
  userId: string
  userEmail: string
  existingData: {
    profile: any
    experiences: any[]
    education: any[]
    skills: any[]
    projects: any[]
    certifications: any[]
    languages: any[]
    valuesPreferences: any
  }
}

const STEPS = [
  { id: 'intro', title: 'Introduction', description: 'Let\'s begin!' },
  { id: 'basic', title: 'Basic Info', description: 'Personal details' },
  { id: 'experience', title: 'Experience', description: 'Work history' },
  { id: 'education', title: 'Education', description: 'Academic background' },
  { id: 'skills', title: 'Skills', description: 'Your expertise' },
  { id: 'projects', title: 'Projects', description: 'Your work' },
  { id: 'certifications', title: 'Certifications', description: 'Credentials' },
  { id: 'languages', title: 'Languages', description: 'Languages you speak' },
  { id: 'values', title: 'Preferences', description: 'Work preferences' },
]

export function ResumeBuilder({ userId, userEmail, existingData }: ResumeBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Mark first login as complete
      const response = await fetch('/api/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        router.push('/main')
        router.refresh()
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    const step = STEPS[currentStep]

    if (step.id === 'intro') {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 p-6">
            <Sparkles className="h-16 w-16 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Let&apos;s begin by filling out your details!
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            We&apos;ll guide you through each section step by step. You can always come back later to update your information.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-2xl">
            {STEPS.slice(1).map((s, index) => (
              <div key={s.id} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mb-2">
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-center">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    switch (step.id) {
      case 'basic':
        return <BasicInfoStep userId={userId} userEmail={userEmail} existingData={existingData.profile} onNext={handleNext} />
      case 'experience':
        return <ExperienceStep userId={userId} existingData={existingData.experiences} onNext={handleNext} />
      case 'education':
        return <EducationStep userId={userId} existingData={existingData.education} onNext={handleNext} />
      case 'skills':
        return <SkillsStep userId={userId} existingData={existingData.skills} onNext={handleNext} />
      case 'projects':
        return <ProjectsStep userId={userId} existingData={existingData.projects} onNext={handleNext} />
      case 'certifications':
        return <CertificationsStep userId={userId} existingData={existingData.certifications} onNext={handleNext} />
      case 'languages':
        return <LanguagesStep userId={userId} existingData={existingData.languages} onNext={handleNext} />
      case 'values':
        return <ValuesPreferencesStep userId={userId} existingData={existingData.valuesPreferences} onNext={handleNext} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}
            </p>
            <p className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </p>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicator */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max pb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium text-center ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 md:w-20 h-1 mx-2 transition-all ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}

            {/* Navigation Buttons (only shown for intro step) */}
            {STEPS[currentStep].id === 'intro' && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {currentStep === STEPS.length - 1 ? (
                    isLoading ? 'Completing...' : 'Complete'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
