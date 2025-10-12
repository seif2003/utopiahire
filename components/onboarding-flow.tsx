'use client'

import { useState } from 'react'
import { OnboardingWelcome } from './onboarding-welcome'
import { OnboardingResume } from './onboarding-resume'

interface OnboardingFlowProps {
  userId: string
}

export function OnboardingFlow({ userId }: OnboardingFlowProps) {
  const [step, setStep] = useState<'welcome' | 'resume'>('welcome')

  if (step === 'welcome') {
    return <OnboardingWelcome onNext={() => setStep('resume')} />
  }

  return <OnboardingResume userId={userId} />
}
