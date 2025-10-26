'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Mail, FileText, Calendar, User, Briefcase, GraduationCap, Award } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Experience {
  id: string
  title: string
  company: string
  start_date: string
  end_date: string | null
}

interface Education {
  id: string
  institution: string
  degree: string
  field_of_study: string
  start_year: number
  end_year: number | null
}

interface Skill {
  id: string
  name: string
  level: string
}

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
    phone: string | null
    location: string | null
    profile_picture: string | null
    headline: string | null
    bio: string | null
    work_preference: string | null
    resume: string | null
  }
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
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
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

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

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingStatus(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      // Update local state
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      ))

      toast.success('Application status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(null)
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
                    {application.profiles.profile_picture ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <Image
                          src={application.profiles.profile_picture}
                          alt={application.profiles.full_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle>{application.profiles.full_name}</CardTitle>
                      {application.profiles.headline && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {application.profiles.headline}
                        </p>
                      )}
                      <CardDescription className="flex flex-col gap-1 mt-2">
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
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusChange(application.id, e.target.value)}
                      disabled={updatingStatus === application.id}
                      className={`px-3 py-1 text-xs rounded-full capitalize border-0 font-medium cursor-pointer ${getStatusColor(application.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="interview">Interview</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(application.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bio */}
                {application.profiles.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">About</h4>
                    <p className="text-sm text-muted-foreground">
                      {application.profiles.bio}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {application.experiences && application.experiences.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </h4>
                    <div className="space-y-3">
                      {application.experiences.map((exp) => (
                        <div key={exp.id} className="text-sm">
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-muted-foreground">{exp.company}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.start_date} - {exp.end_date || 'Present'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {application.education && application.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h4>
                    <div className="space-y-3">
                      {application.education.map((edu) => (
                        <div key={edu.id} className="text-sm">
                          <p className="font-medium">{edu.degree} in {edu.field_of_study}</p>
                          <p className="text-muted-foreground">{edu.institution}</p>
                          <p className="text-xs text-muted-foreground">
                            {edu.start_year} - {edu.end_year || 'Present'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {application.skills && application.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {application.skills.map((skill) => (
                        <span 
                          key={skill.id}
                          className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary"
                        >
                          {skill.name} • {skill.level}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {application.cover_letter && (
                  <div>
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {application.cover_letter}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {(application.resume_url || application.profiles.resume) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(application.resume_url || application.profiles.resume!, '_blank')}
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
