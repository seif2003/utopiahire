'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { JobCard } from '@/components/job-card'
import { Loader2, Sparkles, RefreshCw, SlidersHorizontal, X, MapPin, Briefcase, DollarSign, Building2 } from 'lucide-react'
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

interface Filters {
  location: string
  employment_type: string
  experience_level: string
  is_remote: boolean
  is_hybrid: boolean
  salary_min: string
  salary_max: string
  salary_currency: string
  company_name: string
  required_skills: string
  job_category: string
  posted_days_ago: string
  sort_by: string
  sort_order: string
}

export function MainContent() {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [summary, setSummary] = useState('')
  const [editedSummary, setEditedSummary] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [page, setPage] = useState(0)
  const pageSize = 12
  const [filters, setFilters] = useState<Filters>({
    location: '',
    employment_type: '',
    experience_level: '',
    is_remote: false,
    is_hybrid: false,
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    company_name: '',
    required_skills: '',
    job_category: '',
    posted_days_ago: '',
    sort_by: 'relevance',
    sort_order: 'desc'
  })

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
      // Build request body with filters
      const requestBody: any = {
        page,
        page_size: pageSize,
        query,
      }

      // Add filters only if they have values
      if (filters.location) requestBody.location = filters.location
      if (filters.employment_type) requestBody.employment_type = filters.employment_type
      if (filters.experience_level) requestBody.experience_level = filters.experience_level
      if (filters.is_remote) requestBody.is_remote = filters.is_remote
      if (filters.is_hybrid) requestBody.is_hybrid = filters.is_hybrid
      if (filters.salary_min) requestBody.salary_min = parseInt(filters.salary_min)
      if (filters.salary_max) requestBody.salary_max = parseInt(filters.salary_max)
      if (filters.salary_currency) requestBody.salary_currency = filters.salary_currency
      if (filters.company_name) requestBody.company_name = filters.company_name
      if (filters.required_skills) {
        requestBody.required_skills = filters.required_skills.split(',').map(s => s.trim())
      }
      if (filters.job_category) requestBody.job_category = filters.job_category
      if (filters.posted_days_ago) requestBody.posted_days_ago = parseInt(filters.posted_days_ago)
      if (filters.sort_by) requestBody.sort_by = filters.sort_by
      if (filters.sort_order) requestBody.sort_order = filters.sort_order

      const response = await fetch('/api/match-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch jobs')
      }

      const data = await response.json()
      setJobs(data)
      if (data.length === 0) {
        toast.info('No jobs found matching your criteria. Try adjusting your filters.')
      } else {
        toast.success(`Found ${data.length} matching job${data.length === 1 ? '' : 's'}!`)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch jobs')
      setJobs([])
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      location: '',
      employment_type: '',
      experience_level: '',
      is_remote: false,
      is_hybrid: false,
      salary_min: '',
      salary_max: '',
      salary_currency: 'USD',
      company_name: '',
      required_skills: '',
      job_category: '',
      posted_days_ago: '',
      sort_by: 'relevance',
      sort_order: 'desc'
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.location) count++
    if (filters.employment_type) count++
    if (filters.experience_level) count++
    if (filters.is_remote) count++
    if (filters.is_hybrid) count++
    if (filters.salary_min) count++
    if (filters.salary_max) count++
    if (filters.company_name) count++
    if (filters.required_skills) count++
    if (filters.job_category) count++
    if (filters.posted_days_ago) count++
    return count
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
    <div className="container mx-auto py-4 md:py-8 px-4">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back to Utopia Hire!</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {jobs.length > 0 ? `Found ${jobs.length} matching jobs for you` : 'Discover jobs tailored to your skills'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 relative">
        {/* Mobile Overlay */}
        {showFilters && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Left Sidebar - Filters */}
        <aside className={`
          fixed lg:relative top-0 left-0 h-full lg:h-auto w-80 lg:w-80
          bg-background lg:bg-transparent
          z-50 lg:z-auto
          transform transition-transform duration-300 ease-in-out
          lg:transform-none lg:transition-none
          overflow-y-auto lg:overflow-visible
          shadow-2xl lg:shadow-none
          ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex-shrink-0 space-y-6 p-4 lg:p-0
        `}>
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Close button for mobile */}
            <div className="flex items-center justify-between lg:hidden mb-4">
              <h2 className="text-lg font-bold">Filters & Preferences</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search Preferences Card */}
            <div className="bg-card border rounded-lg p-3 md:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  Job Preferences
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateSummary}
                  disabled={isGeneratingSummary || isLoadingJobs}
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={4}
                placeholder="Describe your ideal job..."
                className="resize-none text-sm"
                disabled={isGeneratingSummary}
              />
              <Button
                onClick={handleFindJobs}
                disabled={isGeneratingSummary || isLoadingJobs || !editedSummary.trim()}
                className="w-full mt-3"
                size="sm"
              >
                {isLoadingJobs ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search Jobs'
                )}
              </Button>
            </div>

            {/* Filters Card */}
            <div className="bg-card border rounded-lg p-3 md:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="w-3 h-3 md:w-4 md:h-4" />
                  Filters
                </h3>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* Location */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </Label>
                  <Input
                    placeholder="City or Remote"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Employment Type */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Type
                  </Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md h-9 text-sm"
                    value={filters.employment_type}
                    onChange={(e) => handleFilterChange('employment_type', e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                {/* Experience Level */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs">Experience</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md h-9 text-sm"
                    value={filters.experience_level}
                    onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                  >
                    <option value="">All Levels</option>
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                {/* Work Type */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs">Work Type</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_remote"
                        checked={filters.is_remote}
                        onChange={(e) => handleFilterChange('is_remote', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="is_remote" className="text-sm cursor-pointer">Remote</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_hybrid"
                        checked={filters.is_hybrid}
                        onChange={(e) => handleFilterChange('is_hybrid', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="is_hybrid" className="text-sm cursor-pointer">Hybrid</label>
                    </div>
                  </div>
                </div>

                {/* Salary Range */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Salary
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.salary_min}
                      onChange={(e) => handleFilterChange('salary_min', e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.salary_max}
                      onChange={(e) => handleFilterChange('salary_max', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <select
                    className="w-full px-3 py-2 border rounded-md h-9 text-xs"
                    value={filters.salary_currency}
                    onChange={(e) => handleFilterChange('salary_currency', e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>

                {/* Company */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Company
                  </Label>
                  <Input
                    placeholder="Company name"
                    value={filters.company_name}
                    onChange={(e) => handleFilterChange('company_name', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Skills */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs">Skills</Label>
                  <Input
                    placeholder="React, Node.js..."
                    value={filters.required_skills}
                    onChange={(e) => handleFilterChange('required_skills', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Posted Date */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs">Posted</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md h-9 text-sm"
                    value={filters.posted_days_ago}
                    onChange={(e) => handleFilterChange('posted_days_ago', e.target.value)}
                  >
                    <option value="">Any time</option>
                    <option value="1">24 hours</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs">Sort</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="w-full px-3 py-2 border rounded-md h-9 text-sm"
                      value={filters.sort_by}
                      onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Date</option>
                      <option value="salary">Salary</option>
                      <option value="company">Company</option>
                    </select>
                    <select
                      className="w-full px-3 py-2 border rounded-md h-9 text-sm"
                      value={filters.sort_order}
                      onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                    >
                      <option value="desc">Desc</option>
                      <option value="asc">Asc</option>
                    </select>
                  </div>
                </div>

                <Button 
                  onClick={handleRefreshJobs} 
                  disabled={isLoadingJobs}
                  className="w-full"
                  size="sm"
                >
                  {isLoadingJobs ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Apply Filters
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full">
          {/* Toggle Filters Button (Mobile) - Floating Action Button */}
          <Button
            variant="default"
            size="icon"
            onClick={() => setShowFilters(true)}
            className="fixed bottom-6 right-6 z-30 lg:hidden w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {getActiveFiltersCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold border-2 border-background">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
            {filters.location && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                <MapPin className="w-3 h-3" />
                {filters.location}
                <button onClick={() => handleFilterChange('location', '')} className="hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.employment_type && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {filters.employment_type}
                <button onClick={() => handleFilterChange('employment_type', '')} className="hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.experience_level && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {filters.experience_level}
                <button onClick={() => handleFilterChange('experience_level', '')} className="hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.is_remote && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Remote
                <button onClick={() => handleFilterChange('is_remote', false)} className="hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.is_hybrid && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Hybrid
                <button onClick={() => handleFilterChange('is_hybrid', false)} className="hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.salary_min || filters.salary_max) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                <DollarSign className="w-3 h-3" />
                {filters.salary_min && `${filters.salary_min}+`}
                {filters.salary_min && filters.salary_max && ' - '}
                {filters.salary_max && filters.salary_max}
                <button onClick={() => { handleFilterChange('salary_min', ''); handleFilterChange('salary_max', '') }} className="hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            </div>
          )}

          {/* Jobs Grid */}
          {isLoadingJobs && jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Finding the best jobs for you...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : editedSummary.trim() ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SlidersHorizontal className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No jobs found</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                We couldn't find any jobs matching your current filters and preferences. Try adjusting your search criteria or removing some filters.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-2"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Let's find your perfect job</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Enter your job preferences in the sidebar to discover opportunities tailored to your skills.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
