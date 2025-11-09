'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  FolderGit, 
  Award, 
  Languages, 
  Heart,
  FileText,
  Edit,
  Sparkles,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building
} from 'lucide-react'
import { ResumeViewer } from './resume-viewer'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import type { 
  Profile, 
  Experience, 
  Education, 
  Skill, 
  Project, 
  Certification, 
  Language, 
  ValuesAndPreferences, 
  JobApplication 
} from '@/types/profile'

interface MyProfileContentProps {
  userId: string
  userEmail: string
  profile: Profile
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  languages: Language[]
  preferences: ValuesAndPreferences
  applications: JobApplication[]
  resumeUrl: string | null
  resumeLatex: string | null
  isResumeLatex: boolean
}

export function MyProfileContent({
  userId,
  userEmail,
  profile,
  experiences,
  education,
  skills,
  projects,
  certifications,
  languages,
  preferences,
  applications,
  resumeUrl,
  resumeLatex,
  isResumeLatex
}: MyProfileContentProps) {
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)

  const generateAIFeedback = async () => {
    setIsLoadingFeedback(true)
    try {
      const response = await fetch('/api/profile-feedback', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate feedback')
      }

      const data = await response.json()
      setAiFeedback(data.feedback)
      toast.success('AI feedback generated!')
    } catch (error) {
      console.error('Error generating feedback:', error)
      toast.error('Failed to generate AI feedback')
    } finally {
      setIsLoadingFeedback(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary">
              My Profile
            </h1>
            <p className="text-gray-600 mt-2">Manage your professional profile and track your applications</p>
          </div>
          <Button 
            onClick={() => window.location.href = '/main/edit-profile'}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* AI Feedback Card */}
        <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
          <CardHeader className="bg-gradient-to-r from-purple-100/50 to-blue-100/50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Profile Insights
              </CardTitle>
              <Button
                onClick={generateAIFeedback}
                disabled={isLoadingFeedback}
                size="sm"
              >
                {isLoadingFeedback ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Insights
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {aiFeedback ? (
              <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700">
                <ReactMarkdown
                  components={{
                    h2: ({ node, ...props }) => (
                      <h2 className="text-xl font-bold mt-4 mb-3 first:mt-0" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="space-y-2 my-3" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="flex items-start gap-2" {...props} />
                    ),
                  }}
                >
                  {aiFeedback}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-gray-600 font-medium mb-2">
                  Get AI-Powered Profile Analysis
                </p>
                <p className="text-gray-500 text-sm">
                  Click &quot;Get Insights&quot; to receive personalized feedback on your profile
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{profile?.full_name || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{userEmail}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.title && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{profile.title}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{experiences.length}</div>
                      <div className="text-xs text-gray-600">Experiences</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{education.length}</div>
                      <div className="text-xs text-gray-600">Education</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{skills.length}</div>
                      <div className="text-xs text-gray-600">Skills</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{applications.length}</div>
                      <div className="text-xs text-gray-600">Applications</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Experience */}
            {experiences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Recent Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {experiences.slice(0, 3).map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-4">
                        <h4 className="font-semibold">{exp.title}</h4>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-xs text-gray-500">
                          {exp.start_date} - {exp.end_date || 'Present'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience ({experiences.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {experiences.length > 0 ? (
                  <div className="space-y-4">
                    {experiences.map((exp, idx) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-4 pb-4">
                        <h4 className="font-semibold text-lg">{exp.title}</h4>
                        <p className="text-gray-700 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {exp.start_date} - {exp.end_date || 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No experience added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education ({education.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {education.length > 0 ? (
                  <div className="space-y-4">
                    {education.map((edu, idx) => (
                      <div key={idx} className="border-l-2 border-purple-500 pl-4 pb-4">
                        <h4 className="font-semibold text-lg">{edu.degree}</h4>
                        <p className="text-gray-700">{edu.field_of_study}</p>
                        <p className="text-sm text-gray-600">{edu.school}</p>
                        <p className="text-sm text-gray-500">
                          {edu.start_year} - {edu.end_year || 'Present'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No education added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Skills ({skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No skills added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Projects */}
            {projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderGit className="h-5 w-5" />
                    Projects ({projects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="border-l-2 border-green-500 pl-4 pb-4">
                        <h4 className="font-semibold text-lg">{proj.name}</h4>
                        {proj.description && (
                          <p className="text-sm text-gray-600 mt-1">{proj.description}</p>
                        )}
                        {proj.url && (
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Project
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications ({certifications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-yellow-600 mt-1" />
                        <div>
                          <h4 className="font-semibold">{cert.name}</h4>
                          {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                          {cert.year && <p className="text-xs text-gray-500">{cert.year}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Languages ({languages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {languages.map((lang, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-semibold">{lang.language}</p>
                        <p className="text-sm text-gray-600 capitalize">{lang.proficiency}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            {preferences && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Work Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {preferences.work_environment && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Work Environment</p>
                      <p className="text-sm text-gray-600">{preferences.work_environment}</p>
                    </div>
                  )}
                  {preferences.company_size && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Company Size</p>
                      <p className="text-sm text-gray-600">{preferences.company_size}</p>
                    </div>
                  )}
                  {preferences.career_goals && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Career Goals</p>
                      <p className="text-sm text-gray-600">{preferences.career_goals}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Job Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((app, idx) => (
                      <div
                        key={idx}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {app.job_offers?.title || 'Job Title'}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Building className="h-4 w-4" />
                              <span>{app.job_offers?.company_name || 'Company'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              app.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : app.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : app.status === 'interview'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {app.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No applications yet</p>
                    <Button
                      onClick={() => window.location.href = '/main/jobs'}
                      className="mt-4"
                      variant="outline"
                    >
                      Browse Jobs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resume Tab */}
          <TabsContent value="resume">
            {resumeUrl ? (
              <ResumeViewer
                userId={userId}
                resumeUrl={resumeUrl}
                resumeLatex={resumeLatex}
                isResumeLatex={isResumeLatex}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No resume uploaded yet</p>
                  <Button
                    onClick={() => window.location.href = '/main/resume-builder'}
                  >
                    Create Resume
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
