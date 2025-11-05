'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Briefcase, GraduationCap, Code, FolderKanban, Award, Languages as LanguagesIcon, Heart, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { BasicInfoStep } from './resume-steps/basic-info-step'
import { ExperienceStep } from './resume-steps/experience-step'
import { EducationStep } from './resume-steps/education-step'
import { SkillsStep } from './resume-steps/skills-step'
import { ProjectsStep } from './resume-steps/projects-step'
import { CertificationsStep } from './resume-steps/certifications-step'
import { LanguagesStep } from './resume-steps/languages-step'
import { ValuesPreferencesStep } from './resume-steps/values-preferences-step'
import { createClient } from '@/lib/client'

interface ProfileEditorProps {
  userId: string
  userEmail: string
  existingData: {
    profile: any
    experiences: any[]
    education: any[]
    skills: any[]
    projects: any[]
    certifications: any[]
    languages: any[]
    valuesPreferences: any
  }
}

const TABS = [
  { id: 'basic', title: 'Basic Info', icon: User },
  { id: 'experience', title: 'Experience', icon: Briefcase },
  { id: 'education', title: 'Education', icon: GraduationCap },
  { id: 'skills', title: 'Skills', icon: Code },
  { id: 'projects', title: 'Projects', icon: FolderKanban },
  { id: 'certifications', title: 'Certifications', icon: Award },
  { id: 'languages', title: 'Languages', icon: LanguagesIcon },
  { id: 'values', title: 'Preferences', icon: Heart },
  { id: 'password', title: 'Password', icon: Lock },
]

export function ProfileEditor({ userId, userEmail, existingData }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const supabase = createClient()
      
      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        toast.error('Current password is incorrect')
        setIsUpdatingPassword(false)
        return
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const renderTabContent = () => {
    const handleNext = () => {
      toast.success('Changes saved successfully!')
    }

    switch (activeTab) {
      case 'basic':
        return <BasicInfoStep userId={userId} userEmail={userEmail} existingData={existingData.profile} onNext={handleNext} />
      case 'experience':
        return <ExperienceStep userId={userId} existingData={existingData.experiences} onNext={handleNext} />
      case 'education':
        return <EducationStep userId={userId} existingData={existingData.education} onNext={handleNext} />
      case 'skills':
        return <SkillsStep userId={userId} existingData={existingData.skills} onNext={handleNext} />
      case 'projects':
        return <ProjectsStep userId={userId} existingData={existingData.projects} onNext={handleNext} />
      case 'certifications':
        return <CertificationsStep userId={userId} existingData={existingData.certifications} onNext={handleNext} />
      case 'languages':
        return <LanguagesStep userId={userId} existingData={existingData.languages} onNext={handleNext} />
      case 'values':
        return <ValuesPreferencesStep userId={userId} existingData={existingData.valuesPreferences} onNext={handleNext} />
      case 'password':
        return (
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen pb-8 px-4 mt-26">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your information and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-9 gap-2 h-auto bg-white p-2 rounded-lg shadow">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-indigo-50 data-[state=active]:"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{tab.title}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const Icon = tab.icon
                      return <Icon className="h-6 w-6 " />
                    })()}
                    {tab.title}
                  </CardTitle>
                  <CardDescription>
                    {tab.id === 'password' 
                      ? 'Update your account password'
                      : `Update your ${tab.title.toLowerCase()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderTabContent()}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
