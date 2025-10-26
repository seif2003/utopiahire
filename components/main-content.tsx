'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { JobCard } from '@/components/job-card'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Job {
  id: string
  company_name: string
  company_logo: string | null
  company_website: string
  company_description: string
  title: string
  description: string
  responsibilities: string[]
  employment_type: string
  experience_level: string
  location: string
  is_remote: boolean
  is_hybrid: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: string
  required_skills: string[]
  preferred_skills: string[]
}

export function MainContent() {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [showDialog, setShowDialog] = useState(true)
  const [summary, setSummary] = useState('')
  const [editedSummary, setEditedSummary] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [page, setPage] = useState(0)
  const pageSize = 12

  const generateSummary = async () => {
    setIsGeneratingSummary(true)
    try {
      const response = await fetch('/api/get-summary')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary || '')
      setEditedSummary(data.summary || '')
      toast.success('Summary generated successfully!')
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate summary')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const fetchJobs = async (query: string) => {
    setIsLoadingJobs(true)
    try {
      const response = await fetch('/api/match-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page,
          page_size: pageSize,
          query,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch jobs')
      }

      const data = await response.json()
      setJobs(data)
      setShowDialog(false)
      toast.success(`Found ${data.length} matching jobs!`)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch jobs')
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const handleFindJobs = () => {
    if (!editedSummary.trim()) {
      toast.error('Please enter a summary or let it be generated')
      return
    }
    fetchJobs(editedSummary)
  }

  const handleRefreshJobs = () => {
    if (editedSummary.trim()) {
      fetchJobs(editedSummary)
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Job Preferences
            </DialogTitle>
            <DialogDescription>
              Enter your job preferences or click "Generate with AI" to create a summary based on your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              rows={6}
              placeholder="Describe what kind of job you're looking for... (e.g., 'I'm looking for a remote full-stack developer position with React and Node.js')"
              className="resize-none"
              disabled={isGeneratingSummary}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                This will be used to find the best matching jobs for you.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSummary}
                disabled={isGeneratingSummary || isLoadingJobs}
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isGeneratingSummary || isLoadingJobs}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFindJobs}
              disabled={isGeneratingSummary || isLoadingJobs || !editedSummary.trim()}
            >
              {isLoadingJobs ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding Jobs...
                </>
              ) : (
                'Find Matching Jobs'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back to Utopia Hire!</h1>
            <p className="text-muted-foreground mt-2">
              {jobs.length > 0 ? `Found ${jobs.length} matching jobs for you` : 'Discover jobs tailored to your skills'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Edit Preferences
            </Button>
            {jobs.length > 0 && (
              <Button
                variant="outline"
                onClick={handleRefreshJobs}
                disabled={isLoadingJobs}
              >
                {isLoadingJobs ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            )}
          </div>
        </div>

        {isLoadingJobs && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Finding the best jobs for you...</p>
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Let's find your perfect job</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Click "Edit Preferences" to customize your job search and discover opportunities tailored to your skills.
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
