'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Globe, 
  Mail,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Upload
} from 'lucide-react'
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
  required_experience_years: number | null
  education_requirements: string[]
  language_requirements: any
  application_deadline: string | null
  positions_available: number
  application_url: string | null
  contact_email: string | null
  benefits: string[]
  company_culture: string[]
  work_schedule: string | null
  relocation_assistance: boolean
  visa_sponsorship: boolean
  status: string
  views_count: number
  applications_count: number
  published_at: string
}

interface JobDetailsProps {
  jobId: string
}

export function JobDetails({ jobId }: JobDetailsProps) {
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Application form state
  const [coverLetter, setCoverLetter] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [useExistingResume, setUseExistingResume] = useState(true)
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null)
  const [newResumeUrl, setNewResumeUrl] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    fetchJob()
    fetchUserProfile()
  }, [jobId])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user-profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        setEmail(data.email || '')
        setPhone(data.phone || '')
        // If user doesn't have an existing resume, default to upload new
        if (!data.resume) {
          setUseExistingResume(false)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchJob = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch job details')
      }

      const data = await response.json()
      setJob(data)
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch job details')
      router.push('/main')
    } finally {
      setIsLoading(false)
    }
  }

  const formatSalary = () => {
    if (!job || (!job.salary_min && !job.salary_max)) return null
    
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
    if (!job) return ''
    if (job.is_remote) return 'Remote'
    if (job.is_hybrid) return 'Hybrid'
    return 'On-site'
  }

  const handleApply = () => {
    if (job?.application_url) {
      window.open(job.application_url, '_blank')
    } else {
      // Open internal application dialog
      setShowApplicationDialog(true)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF and Word documents are allowed')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB')
      return
    }

    setIsUploadingResume(true)
    setNewResumeFile(file)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume')
      }

      setNewResumeUrl(data.url)
      toast.success('Resume uploaded successfully!')
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload resume')
      setNewResumeFile(null)
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleSubmitApplication = async () => {
    if (!email || !phone) {
      toast.error('Please provide your email and phone number')
      return
    }

    if (!useExistingResume && !newResumeUrl) {
      toast.error('Please upload a resume or use your existing one')
      return
    }

    if (useExistingResume && !userProfile?.resume) {
      toast.error('No existing resume found. Please upload one.')
      return
    }

    setIsSubmittingApplication(true)

    try {
      const applicationData = {
        job_id: jobId,
        cover_letter: coverLetter || null,
        resume_url: useExistingResume ? userProfile?.resume : newResumeUrl,
        email,
        phone,
      }

      const response = await fetch('/api/apply-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      toast.success('Application submitted successfully!')
      setShowApplicationDialog(false)
      // Reset form
      setCoverLetter('')
      setUseExistingResume(true)
      setNewResumeFile(null)
      setNewResumeUrl(null)
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setIsSubmittingApplication(false)
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
          <Button onClick={() => router.push('/main')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {job.company_logo ? (
                <img 
                  src={job.company_logo} 
                  alt={job.company_name}
                  className="w-16 h-16 rounded object-contain"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-lg flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5" />
                  {job.company_name}
                </CardDescription>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {(job.location || getWorkType()) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location || getWorkType()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="capitalize">{job.employment_type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{job.experience_level}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button size="lg" onClick={handleApply}>
              Apply Now
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About the Job */}
          <Card>
            <CardHeader>
              <CardTitle>About the Job</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Required Skills */}
          {job.required_skills && job.required_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferred Skills */}
          {job.preferred_skills && job.preferred_skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preferred Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 text-sm rounded-full bg-muted text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Company Description */}
          {job.company_description && (
            <Card>
              <CardHeader>
                <CardTitle>About {job.company_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{job.company_description}</p>
                {job.company_website && (
                  <a 
                    href={job.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline mt-4"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Company Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Compensation */}
          {formatSalary() && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compensation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="w-5 h-5 text-primary" />
                  {formatSalary()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {job.required_experience_years && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Experience</p>
                    <p className="text-muted-foreground">{job.required_experience_years}+ years</p>
                  </div>
                </div>
              )}
              
              {job.positions_available > 1 && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Positions</p>
                    <p className="text-muted-foreground">{job.positions_available} openings</p>
                  </div>
                </div>
              )}

              {job.application_deadline && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Application Deadline</p>
                    <p className="text-muted-foreground">
                      {new Date(job.application_deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {job.work_schedule && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Work Schedule</p>
                    <p className="text-muted-foreground">{job.work_schedule}</p>
                  </div>
                </div>
              )}

              {job.contact_email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Contact</p>
                    <a 
                      href={`mailto:${job.contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {job.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {(job.relocation_assistance || job.visa_sponsorship) && (
                <div className="pt-2 border-t">
                  <p className="font-medium mb-2">Additional Benefits</p>
                  <div className="space-y-1">
                    {job.relocation_assistance && (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Relocation Assistance
                      </p>
                    )}
                    {job.visa_sponsorship && (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Visa Sponsorship
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apply Card */}
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" size="lg" onClick={handleApply}>
                Apply for this Position
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                {job.views_count} people have viewed this job
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {job?.title}</DialogTitle>
            <DialogDescription>
              Fill in your application details. Your information will be sent to {job?.company_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a great fit for this position..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Resume Selection */}
            <div className="space-y-3">
              <Label>Resume</Label>
              <div className="space-y-2">
                {userProfile?.resume && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="existingResume"
                      name="resumeChoice"
                      checked={useExistingResume}
                      onChange={() => {
                        setUseExistingResume(true)
                        setNewResumeFile(null)
                        setNewResumeUrl(null)
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="existingResume" className="font-normal cursor-pointer">
                      Use my existing resume
                    </Label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="newResume"
                    name="resumeChoice"
                    checked={!useExistingResume}
                    onChange={() => setUseExistingResume(false)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="newResume" className="font-normal cursor-pointer">
                    Upload a new resume for this application
                  </Label>
                </div>
              </div>

              {!useExistingResume && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingResume}
                    >
                      {isUploadingResume ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {newResumeFile ? 'Change Resume' : 'Upload Resume'}
                        </>
                      )}
                    </Button>
                    {newResumeFile && (
                      <span className="text-sm text-muted-foreground">
                        {newResumeFile.name}
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Accepted formats: PDF, DOC, DOCX. Max size: 5MB
                  </p>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApplicationDialog(false)}
              disabled={isSubmittingApplication}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={isSubmittingApplication || isUploadingResume}
            >
              {isSubmittingApplication ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
