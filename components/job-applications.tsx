'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Mail, FileText, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

interface Application {
  id: string
  user_id: string
  cover_letter: string | null
  resume_url: string | null
  status: string
  applied_at: string
  profiles: {
    full_name: string
    email: string
    avatar_url: string | null
    phone: string | null
    location: string | null
  }
}

interface Job {
  id: string
  title: string
  company_name: string
  posted_by: string
}

interface JobApplicationsProps {
  jobId: string
  userId: string
}

export function JobApplications({ jobId, userId }: JobApplicationsProps) {
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchJobAndApplications()
  }, [jobId])

  const fetchJobAndApplications = async () => {
    setIsLoading(true)
    try {
      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`)
      if (!jobResponse.ok) {
        throw new Error('Failed to fetch job')
      }
      const jobData = await jobResponse.json()
      
      // Check if user owns this job
      if (jobData.posted_by !== userId) {
        toast.error('You do not have permission to view these applications')
        router.push('/main/my-jobs')
        return
      }
      
      setJob(jobData)

      // Fetch applications
      const appsResponse = await fetch(`/api/jobs/${jobId}/applications`)
      if (!appsResponse.ok) {
        throw new Error('Failed to fetch applications')
      }
      const appsData = await appsResponse.json()
      setApplications(appsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
      case 'reviewing':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      case 'interview':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      case 'accepted':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'rejected':
        return 'bg-red-500/10 text-red-600 dark:text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">Job not found</p>
          <Button onClick={() => router.push('/main/my-jobs')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/main/my-jobs')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Jobs
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="text-muted-foreground mt-2">
          {job.company_name} • {applications.length} {applications.length === 1 ? 'application' : 'applications'}
        </p>
      </div>

      {applications.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{application.profiles.full_name}</CardTitle>
                      <CardDescription className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {application.profiles.email}
                        </span>
                        {application.profiles.phone && (
                          <span>{application.profiles.phone}</span>
                        )}
                        {application.profiles.location && (
                          <span>{application.profiles.location}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full capitalize ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(application.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {application.cover_letter && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {application.cover_letter}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  {application.resume_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(application.resume_url!, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Resume
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `mailto:${application.profiles.email}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No applications yet</h2>
            <p className="text-muted-foreground max-w-md">
              This job posting hasn't received any applications yet. Share the job link to attract candidates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
