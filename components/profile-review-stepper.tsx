'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

// Import the existing step components
import { BasicInfoStep } from '@/components/resume-steps/basic-info-step'
import { ExperienceStep } from '@/components/resume-steps/experience-step'
import { EducationStep } from '@/components/resume-steps/education-step'
import { SkillsStep } from '@/components/resume-steps/skills-step'
import { ProjectsStep } from '@/components/resume-steps/projects-step'
import { CertificationsStep } from '@/components/resume-steps/certifications-step'
import { LanguagesStep } from '@/components/resume-steps/languages-step'
import { ValuesPreferencesStep } from '@/components/resume-steps/values-preferences-step'

const STEPS = [
  { id: 'basic', label: 'Basic Info', component: BasicInfoStep },
  { id: 'experience', label: 'Experience', component: ExperienceStep },
  { id: 'education', label: 'Education', component: EducationStep },
  { id: 'skills', label: 'Skills', component: SkillsStep },
  { id: 'projects', label: 'Projects', component: ProjectsStep },
  { id: 'certifications', label: 'Certifications', component: CertificationsStep },
  { id: 'languages', label: 'Languages', component: LanguagesStep },
  { id: 'values', label: 'Values & Preferences', component: ValuesPreferencesStep },
]

interface ProfileReviewStepperProps {
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
    values_preferences: any[]
  }
}

export function ProfileReviewStepper({ userId, userEmail, existingData }: ProfileReviewStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
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
      // Mark onboarding as complete WITHOUT generating resume
      const response = await fetch('/api/mark-onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error completing onboarding:', error)
        toast.error(error.error || 'Failed to complete setup. Please try again.')
        setIsLoading(false)
        return
      }

      // Success - redirect to main page
      toast.success('Profile setup complete!')
      window.location.href = '/main'
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    const step = STEPS[currentStep]

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
        return <ValuesPreferencesStep userId={userId} existingData={existingData.values_preferences} onNext={handleComplete} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-semibold">Review Your Profile</h1>
            <p className="text-sm text-muted-foreground">
              Verify and edit the information we extracted from your resume
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b bg-muted/40 p-4 sticky top-16 z-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="p-6">
          {renderStepContent()}
        </Card>

        {/* Back button for navigation */}
        {currentStep > 0 && (
          <div className="flex justify-start mt-6">
            <Button
              variant="ghost"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {STEPS[currentStep - 1].label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
