'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';
import { Plus, X, ArrowLeft } from 'lucide-react';

export default function AddJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('org');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic arrays
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['']);
  const [educationRequirements, setEducationRequirements] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [companyCulture, setCompanyCulture] = useState<string[]>(['']);

  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    company_logo: '',
    company_website: '',
    company_description: '',

    // Job Details
    title: '',
    description: '',

    // Employment Details
    employment_type: 'full-time',
    experience_level: 'mid',
    location: '',
    is_remote: false,
    is_hybrid: false,

    // Compensation
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    salary_period: 'yearly',

    // Requirements
    required_experience_years: '',
    language_requirements: '',

    // Application Details
    application_deadline: '',
    positions_available: '1',
    application_url: '',
    contact_email: '',

    // Additional Information
    work_schedule: '',
    relocation_assistance: false,
    visa_sponsorship: false,

    // Status
    status: 'draft',
  });

  // Fetch organization data if org parameter is present
  useEffect(() => {
    if (organizationId) {
      fetchOrganizationData()
    }
  }, [organizationId])

  const fetchOrganizationData = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`)
      
      if (!response.ok) {
        toast.error('Failed to load organization')
        return
      }

      const org = await response.json()
      setOrganizationName(org.name)
      
      // Pre-fill company information from organization
      setFormData(prev => ({
        ...prev,
        company_name: org.name || '',
        company_logo: org.logo_url || '',
        company_website: org.website || '',
        company_description: org.description || '',
      }))

      if (org.logo_url) {
        setLogoPreview(org.logo_url)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
      toast.error('Failed to load organization data')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 2MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const uploadFormData = new FormData();
      uploadFormData.append('logo', file);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      setFormData((prev) => ({ ...prev, company_logo: data.url }));
      setLogoPath(data.path);
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoPath) {
      setLogoPreview(null);
      setFormData((prev) => ({ ...prev, company_logo: '' }));
      return;
    }

    try {
      const response = await fetch(`/api/upload-logo?path=${encodeURIComponent(logoPath)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete logo');
      }

      setLogoPreview(null);
      setLogoPath(null);
      setFormData((prev) => ({ ...prev, company_logo: '' }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Logo removed successfully!');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent, publishNow: boolean = false) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data
      const jobData = {
        ...formData,
        organization_id: organizationId || null, // Include organization ID
        responsibilities: responsibilities.filter((r) => r.trim() !== ''),
        required_skills: requiredSkills.filter((s) => s.trim() !== ''),
        preferred_skills: preferredSkills.filter((s) => s.trim() !== ''),
        education_requirements: educationRequirements.filter((e) => e.trim() !== ''),
        benefits: benefits.filter((b) => b.trim() !== ''),
        company_culture: companyCulture.filter((c) => c.trim() !== ''),
        language_requirements: formData.language_requirements
          ? JSON.parse(formData.language_requirements)
          : null,
        required_experience_years: formData.required_experience_years
          ? parseInt(formData.required_experience_years)
          : null,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        positions_available: parseInt(formData.positions_available),
        status: publishNow ? 'active' : formData.status,
      };

      const response = await fetch('/api/add-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job offer');
      }

      toast.success(
        publishNow
          ? 'Job offer published successfully!'
          : 'Job offer saved as draft!'
      );
      
      // Redirect back to organization jobs if org parameter is present
      if (organizationId) {
        router.push(`/main/my-jobs/${organizationId}`)
      } else {
        router.push('/main/my-jobs')
      }
    } catch (error) {
      console.error('Error creating job offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create job offer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {organizationId && (
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/main/my-jobs/${organizationId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {organizationName || 'Organization'}
        </Button>
      )}
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Post a New Job</h1>
        <p className="text-muted-foreground mt-2">
          {organizationId 
            ? `Create a job posting for ${organizationName || 'your organization'}` 
            : 'Fill in the details to create a new job posting'}
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              {organizationId 
                ? 'Company information is pre-filled from your organization' 
                : 'Tell candidates about your company'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={!!organizationId} // Disable if organization is set
                required
              />
            </div>
            <div>
              <Label htmlFor="company_logo">Company Logo</Label>
              <div className="space-y-4">
                {logoPreview ? (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <Image
                      src={logoPreview}
                      alt="Company logo preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    No logo
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleRemoveLogo}
                      disabled={isUploadingLogo}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: JPEG, PNG, WebP, SVG. Max size: 2MB
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="company_website">Company Website</Label>
              <Input
                id="company_website"
                name="company_website"
                type="url"
                value={formData.company_website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="company_description">Company Description</Label>
              <Textarea
                id="company_description"
                name="company_description"
                value={formData.company_description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of your company..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Describe the position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Detailed description of the role..."
              />
            </div>
            <div>
              <Label>Responsibilities</Label>
              <div className="space-y-2">
                {responsibilities.map((resp, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={resp}
                      onChange={(e) => {
                        const newResp = [...responsibilities];
                        newResp[index] = e.target.value;
                        setResponsibilities(newResp);
                      }}
                      placeholder="e.g., Design and develop features"
                    />
                    {responsibilities.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setResponsibilities(responsibilities.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResponsibilities([...responsibilities, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Responsibility
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
            <CardDescription>Specify work arrangement and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employment_type">Employment Type *</Label>
                <select
                  id="employment_type"
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-input bg-background rounded-md"
                  required
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <Label htmlFor="experience_level">Experience Level *</Label>
                <select
                  id="experience_level"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-input bg-background rounded-md"
                  required
                >
                  <option value="entry">Entry</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g., New York, NY or Remote"
              />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_remote"
                  name="is_remote"
                  checked={formData.is_remote}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_remote">Remote</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_hybrid"
                  name="is_hybrid"
                  checked={formData.is_hybrid}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_hybrid">Hybrid</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
            <CardDescription>Salary range and benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_min">Minimum Salary</Label>
                <Input
                  id="salary_min"
                  name="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={handleChange}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="salary_max">Maximum Salary</Label>
                <Input
                  id="salary_max"
                  name="salary_max"
                  type="number"
                  value={formData.salary_max}
                  onChange={handleChange}
                  placeholder="80000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_currency">Currency</Label>
                <Input
                  id="salary_currency"
                  name="salary_currency"
                  value={formData.salary_currency}
                  onChange={handleChange}
                  placeholder="USD"
                />
              </div>
              <div>
                <Label htmlFor="salary_period">Period</Label>
                <select
                  id="salary_period"
                  name="salary_period"
                  value={formData.salary_period}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-input bg-background rounded-md"
                >
                  <option value="hourly">Hourly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Benefits</Label>
              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => {
                        const newBenefits = [...benefits];
                        newBenefits[index] = e.target.value;
                        setBenefits(newBenefits);
                      }}
                      placeholder="e.g., Health insurance"
                    />
                    {benefits.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setBenefits(benefits.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBenefits([...benefits, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Benefit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>What candidates need to have</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Required Skills *</Label>
              <div className="space-y-2">
                {requiredSkills.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...requiredSkills];
                        newSkills[index] = e.target.value;
                        setRequiredSkills(newSkills);
                      }}
                      placeholder="e.g., JavaScript"
                      required={index === 0}
                    />
                    {requiredSkills.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRequiredSkills([...requiredSkills, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Required Skill
                </Button>
              </div>
            </div>
            <div>
              <Label>Preferred Skills</Label>
              <div className="space-y-2">
                {preferredSkills.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...preferredSkills];
                        newSkills[index] = e.target.value;
                        setPreferredSkills(newSkills);
                      }}
                      placeholder="e.g., TypeScript"
                    />
                    {preferredSkills.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPreferredSkills(preferredSkills.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreferredSkills([...preferredSkills, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Preferred Skill
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="required_experience_years">Years of Experience Required</Label>
              <Input
                id="required_experience_years"
                name="required_experience_years"
                type="number"
                value={formData.required_experience_years}
                onChange={handleChange}
                placeholder="3"
              />
            </div>
            <div>
              <Label>Education Requirements</Label>
              <div className="space-y-2">
                {educationRequirements.map((edu, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={edu}
                      onChange={(e) => {
                        const newEdu = [...educationRequirements];
                        newEdu[index] = e.target.value;
                        setEducationRequirements(newEdu);
                      }}
                      placeholder="e.g., Bachelor's in Computer Science"
                    />
                    {educationRequirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEducationRequirements(educationRequirements.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEducationRequirements([...educationRequirements, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education Requirement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>How candidates can apply</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="application_deadline">Application Deadline</Label>
              <Input
                id="application_deadline"
                name="application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="positions_available">Positions Available</Label>
              <Input
                id="positions_available"
                name="positions_available"
                type="number"
                value={formData.positions_available}
                onChange={handleChange}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="application_url">External Application URL</Label>
              <Input
                id="application_url"
                name="application_url"
                type="url"
                value={formData.application_url}
                onChange={handleChange}
                placeholder="https://company.com/apply"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="hiring@company.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Extra details about the position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Culture</Label>
              <div className="space-y-2">
                {companyCulture.map((culture, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={culture}
                      onChange={(e) => {
                        const newCulture = [...companyCulture];
                        newCulture[index] = e.target.value;
                        setCompanyCulture(newCulture);
                      }}
                      placeholder="e.g., Remote-first"
                    />
                    {companyCulture.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setCompanyCulture(companyCulture.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompanyCulture([...companyCulture, ''])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Culture Value
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="work_schedule">Work Schedule</Label>
              <Input
                id="work_schedule"
                name="work_schedule"
                value={formData.work_schedule}
                onChange={handleChange}
                placeholder="Monday-Friday, 9AM-5PM"
              />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="relocation_assistance"
                  name="relocation_assistance"
                  checked={formData.relocation_assistance}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="relocation_assistance">Relocation Assistance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="visa_sponsorship"
                  name="visa_sponsorship"
                  checked={formData.visa_sponsorship}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="visa_sponsorship">Visa Sponsorship</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isLoading}
          >
            {isLoading ? 'Publishing...' : 'Publish Now'}
          </Button>
        </div>
      </form>
    </div>
  );
}
