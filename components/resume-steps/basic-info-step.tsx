'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, Loader2, Upload, X, User } from 'lucide-react'
import { createClient } from '@/lib/client'
import { toast } from 'sonner'
import Image from 'next/image'

interface BasicInfoStepProps {
  userId: string
  userEmail: string
  existingData: any
  onNext: () => void
}

export function BasicInfoStep({ userId, userEmail, existingData, onNext }: BasicInfoStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    full_name: existingData?.full_name || '',
    headline: existingData?.headline || '',
    email: existingData?.email || userEmail,
    phone: existingData?.phone || '',
    location: existingData?.location || '',
    bio: existingData?.bio || '',
    work_preference: existingData?.work_preference || 'full-time',
    visibility_mode: existingData?.visibility_mode || 'public',
    profile_picture: existingData?.profile_picture || '',
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsUploadingImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('avatar', file)

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, profile_picture: data.url }))
      toast.success('Profile picture uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!formData.profile_picture) return

    setIsUploadingImage(true)
    try {
      const response = await fetch('/api/upload-avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      setFormData(prev => ({ ...prev, profile_picture: '' }))
      toast.success('Profile picture removed')
    } catch (error: any) {
      console.error('Error removing image:', error)
      toast.error(error.message || 'Failed to remove image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...formData,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      onNext()
    } catch (error) {
      console.error('Error saving basic info:', error)
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <div className="relative">
          {formData.profile_picture ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
              <Image
                src={formData.profile_picture}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
              <User className="w-16 h-16 text-primary" />
            </div>
          )}
          {formData.profile_picture && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isUploadingImage}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {formData.profile_picture ? 'Change Photo' : 'Upload Photo'}
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          JPEG, PNG or WebP • Max 2MB
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            placeholder="Full-stack Developer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="San Francisco, CA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="work_preference">Work Preference</Label>
          <select
            id="work_preference"
            value={formData.work_preference}
            onChange={(e) => setFormData({ ...formData, work_preference: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="freelance">Freelance</option>
            <option value="remote">Remote</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio / About Me</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility_mode">Profile Visibility</Label>
        <select
          id="visibility_mode"
          value={formData.visibility_mode}
          onChange={(e) => setFormData({ ...formData, visibility_mode: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="public">Public</option>
          <option value="anonymous">Anonymous</option>
        </select>
        <p className="text-sm text-gray-500">
          Anonymous mode promotes fairness by hiding identifying information from employers
        </p>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
