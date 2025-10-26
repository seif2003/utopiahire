'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
      toast.info('Uploading and processing your resume...')
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload resume')
      }

      setUploading(false)
      
      // Check if n8n processing was successful
      if (result.success) {
        toast.success('Resume processed successfully! Review your information...')
        
        // Navigate to profile review stepper to review and edit extracted data
        window.location.href = '/main/profile-review'
      } else {
        throw new Error('Resume processing failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload resume. Please try again.')
      setUploading(false)
    }
  }

  const handleCreateResume = async () => {
    // Mark onboarding as complete and navigate to resume builder
    try {
      await fetch('/api/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, hasResume: false }),
      })
      
      router.push('/main/resume-builder')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      router.push('/main/resume-builder')
    }
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
                <p className="text-sm text-muted-foreground">
                  After processing, you'll review and verify all extracted information step by step.
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
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Upload Resume
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
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
                  Don't have a resume? No problem! We'll guide you through building a professional resume from scratch with our step-by-step builder.
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
