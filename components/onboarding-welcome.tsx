'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface OnboardingWelcomeProps {
  onNext: () => void
}

export function OnboardingWelcome({ onNext }: OnboardingWelcomeProps) {
  return (
    <div className="flex h-svh w-full items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to Utopia Hire
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            An AI-powered platform that promotes fairness and inclusivity in employment.
          </p>
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={onNext}
            size="lg"
            className="px-8"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
