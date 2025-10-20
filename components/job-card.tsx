'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Briefcase, DollarSign, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Job {
  id: string
  company_name: string
  company_logo: string | null
  company_website: string
  title: string
  description: string
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
}

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const router = useRouter()

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salary_currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

    if (job.salary_min && job.salary_max) {
      return `${formatter.format(job.salary_min)} - ${formatter.format(job.salary_max)} / ${job.salary_period}`
    } else if (job.salary_min) {
      return `From ${formatter.format(job.salary_min)} / ${job.salary_period}`
    } else if (job.salary_max) {
      return `Up to ${formatter.format(job.salary_max)} / ${job.salary_period}`
    }
  }

  const getWorkType = () => {
    if (job.is_remote) return 'Remote'
    if (job.is_hybrid) return 'Hybrid'
    return 'On-site'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/main/jobs/${job.id}`)}>
      <CardHeader>
        <div className="flex items-start gap-4">
          {job.company_logo ? (
            <img 
              src={job.company_logo} 
              alt={job.company_name}
              className="w-12 h-12 rounded object-contain"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Building2 className="w-4 h-4" />
              {job.company_name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </p>
        
        <div className="flex flex-wrap gap-4 text-sm">
          {job.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{job.location || getWorkType()}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            <span className="capitalize">{job.employment_type.replace('-', ' ')}</span>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="capitalize">{job.experience_level}</span>
          </div>
        </div>

        {formatSalary() && (
          <div className="flex items-center gap-1 text-sm font-medium">
            <DollarSign className="w-4 h-4" />
            <span>{formatSalary()}</span>
          </div>
        )}

        {job.required_skills && job.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {job.required_skills.slice(0, 5).map((skill, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
              >
                {skill}
              </span>
            ))}
            {job.required_skills.length > 5 && (
              <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                +{job.required_skills.length - 5} more
              </span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/main/jobs/${job.id}`)
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
