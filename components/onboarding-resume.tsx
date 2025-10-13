'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, ArrowRight } from 'lucide-react'

interface OnboardingResumeProps {
  userId: string
}

export function OnboardingResume({ userId }: OnboardingResumeProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // TODO: Implement resume upload logic
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        // Mark first login as complete and redirect
        await fetch('/api/complete-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, hasResume: true }),
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateResume = () => {
    // Navigate to resume builder
    // The complete-onboarding API will be called after user completes all steps
    router.push('/main/resume-builder')
  }

  return (
    <div className="flex h-svh w-full items-center justify-center px-4">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Let's Get You Started
          </h2>
          <p className="text-muted-foreground">
            Choose how you'd like to proceed with your profile
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Resume Card */}
          <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">
                  Upload Your Resume
                </h3>
                <p className="text-muted-foreground">
                  Already have a resume? Upload it and we'll extract your information automatically.
                </p>
              </div>

              <div className="pt-4">
                <label htmlFor="resume-upload">
                  <Button 
                    className="w-full"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      {uploading ? 'Uploading...' : 'Upload Resume'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </span>
                  </Button>
                </label>
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleUploadResume}
                  disabled={uploading}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX
              </p>
            </div>
          </Card>

          {/* Create Resume Card */}
          <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold">
                  Create a New Resume
                </h3>
                <p className="text-muted-foreground">
                  Don't have a resume? No problem! We'll guide you through creating one from scratch.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={handleCreateResume}
                >
                  Create Resume
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Step-by-step guided process
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
