'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Eye, Users, Calendar, MoreVertical, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface Job {
  id: string
  company_name: string
  company_logo: string | null
  title: string
  description: string
  employment_type: string
  experience_level: string
  location: string
  is_remote: boolean
  is_hybrid: boolean
  status: string
  views_count: number
  applications_count: number
  published_at: string
  created_at: string
}

interface MyJobsContentProps {
  userId: string
}

export function MyJobsContent({ userId }: MyJobsContentProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'paused' | 'closed'>('all')

  useEffect(() => {
    fetchMyJobs()
  }, [filter])

  const fetchMyJobs = async () => {
    setIsLoading(true)
    try {
      const url = filter === 'all' 
        ? '/api/my-jobs' 
        : `/api/my-jobs?status=${filter}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch jobs')
      }

      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete job')
      }

      toast.success('Job deleted successfully')
      fetchMyJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete job')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'draft':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
      case 'closed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  const getWorkType = (job: Job) => {
    if (job.is_remote) return 'Remote'
    if (job.is_hybrid) return 'Hybrid'
    return 'On-site'
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Job Postings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your job listings and view applications
          </p>
        </div>
        <Button onClick={() => router.push('/main/add-job')}>
          <Plus className="w-4 h-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'draft', 'active', 'paused', 'closed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status as typeof filter)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                    <CardDescription className="mt-1">{job.company_name}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {job.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{job.location || getWorkType(job)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{job.employment_type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-medium capitalize">{job.experience_level}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>{job.views_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{job.applications_count || 0}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/main/jobs/${job.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/main/jobs/${job.id}/applications`)}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Candidates ({job.applications_count || 0})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteJob(job.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No job postings yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start by creating your first job posting to attract talented candidates.
          </p>
          <Button onClick={() => router.push('/main/add-job')}>
            <Plus className="w-4 h-4 mr-2" />
            Post Your First Job
          </Button>
        </div>
      )}
    </div>
  )
}
