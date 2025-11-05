'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Building2, Briefcase, Trash2, Edit, Globe, Mail, MapPin, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Organization {
  id: string
  name: string
  description: string | null
  website: string | null
  industry: string | null
  size: string | null
  logo_url: string | null
  city: string | null
  country: string | null
  contact_email: string | null
  is_active: boolean
  created_at: string
}

interface OrganizationManagerProps {
  userId: string
}

export function OrganizationManager({ userId }: OrganizationManagerProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    city: '',
    country: '',
    contact_email: '',
    logo_url: '',
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/organizations')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch organizations')
      }

      const data = await response.json()
      setOrganizations(data)
    } catch (error) {
      console.error('Error fetching organizations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch organizations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (org?: Organization) => {
    if (org) {
      setEditingOrg(org)
      setFormData({
        name: org.name || '',
        description: org.description || '',
        website: org.website || '',
        industry: org.industry || '',
        size: org.size || '',
        city: org.city || '',
        country: org.country || '',
        contact_email: org.contact_email || '',
        logo_url: org.logo_url || '',
      })
      setLogoPreview(org.logo_url)
    } else {
      setEditingOrg(null)
      setFormData({
        name: '',
        description: '',
        website: '',
        industry: '',
        size: '',
        city: '',
        country: '',
        contact_email: '',
        logo_url: '',
      })
      setLogoPreview(null)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingOrg(null)
    setLogoPreview(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed')
      return
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 2MB')
      return
    }

    setIsUploadingLogo(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const uploadFormData = new FormData()
      uploadFormData.append('logo', file)

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo')
      }

      setFormData({ ...formData, logo_url: data.url })
      toast.success('Logo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo')
      setLogoPreview(null)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setFormData({ ...formData, logo_url: '' })
    toast.success('Logo removed')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingOrg 
        ? `/api/organizations/${editingOrg.id}` 
        : '/api/organizations'
      
      const method = editingOrg ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save organization')
      }

      toast.success(editingOrg ? 'Organization updated successfully' : 'Organization created successfully')
      handleCloseDialog()
      fetchOrganizations()
    } catch (error) {
      console.error('Error saving organization:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save organization')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? All associated jobs will also be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete organization')
      }

      toast.success('Organization deleted successfully')
      fetchOrganizations()
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization')
    }
  }

  const handleViewJobs = (orgId: string) => {
    router.push(`/main/my-jobs/${orgId}`)
  }

  const handleAddJob = (orgId: string) => {
    router.push(`/main/add-job?org=${orgId}`)
  }

  return (
    <>
      <div className="container mx-auto pb-8 px-4 pt-26">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Organizations</h1>
            <p className="text-muted-foreground mt-2">
              Manage your companies and their job postings
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : organizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card key={org.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {org.logo_url ? (
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden border">
                        <Image
                          src={org.logo_url}
                          alt={org.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{org.name}</CardTitle>
                      {org.industry && (
                        <CardDescription className="mt-1">{org.industry}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {org.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {org.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    {org.city && org.country && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{org.city}, {org.country}</span>
                      </div>
                    )}
                    {org.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={org.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {org.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {org.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{org.contact_email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAddJob(org.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Job
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewJobs(org.id)}
                  >
                    <Briefcase className="w-4 h-4 mr-1" />
                    Jobs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(org)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteOrganization(org.id)}
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
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No organizations yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first organization to start posting jobs and managing your hiring process.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Organization
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrg ? 'Edit Organization' : 'Create Organization'}
            </DialogTitle>
            <DialogDescription>
              {editingOrg 
                ? 'Update your organization information' 
                : 'Add a new organization to manage your job postings'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Acme Corporation"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WebP or SVG. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your organization..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="51-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="San Francisco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="United States"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingOrg ? 'Update' : 'Create'} Organization
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
