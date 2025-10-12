'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Plus, Trash2, Briefcase, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/client'

interface Experience {
  id?: string
  title: string
  company: string
  location: string
  start_date: string
  end_date: string
  description: string
  proof_link: string
  current: boolean
}

interface ExperienceStepProps {
  userId: string
  existingData: any[]
  onNext: () => void
}

export function ExperienceStep({ userId, existingData, onNext }: ExperienceStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [experiences, setExperiences] = useState<Experience[]>(
    existingData.length > 0
      ? existingData.map(exp => ({
          ...exp,
          current: !exp.end_date,
          end_date: exp.end_date || '',
        }))
      : [{
          title: '',
          company: '',
          location: '',
          start_date: '',
          end_date: '',
          description: '',
          proof_link: '',
          current: false,
        }]
  )

  const addExperience = () => {
    setExperiences([...experiences, {
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      description: '',
      proof_link: '',
      current: false,
    }])
  }

  const removeExperience = async (index: number) => {
    const exp = experiences[index]
    
    if (exp.id) {
      try {
        const supabase = createClient()
        await supabase.from('experiences').delete().eq('id', exp.id)
      } catch (error) {
        console.error('Error deleting experience:', error)
      }
    }
    
    setExperiences(experiences.filter((_, i) => i !== index))
  }

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experiences]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === 'current' && value) {
      updated[index].end_date = ''
    }
    
    setExperiences(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate: if any field is filled, required fields must be complete
      for (let i = 0; i < experiences.length; i++) {
        const exp = experiences[i]
        const hasAnyField = exp.title || exp.company || exp.location || exp.start_date || exp.description || exp.proof_link
        
        if (hasAnyField) {
          if (!exp.title || !exp.company || !exp.start_date) {
            alert(`Experience #${i + 1}: Please complete all required fields (Job Title, Company, Start Date) or remove this entry.`)
            setIsLoading(false)
            return
          }
          
          if (!exp.current && !exp.end_date) {
            alert(`Experience #${i + 1}: Please provide an End Date or check "I currently work here".`)
            setIsLoading(false)
            return
          }
        }
      }

      const supabase = createClient()

      // Filter out completely empty experiences
      const validExperiences = experiences.filter(exp => exp.title && exp.company)

      for (const exp of validExperiences) {
        const data = {
          user_id: userId,
          title: exp.title,
          company: exp.company,
          location: exp.location,
          start_date: exp.start_date,
          end_date: exp.current ? null : exp.end_date || null,
          description: exp.description,
          proof_link: exp.proof_link,
        }

        if (exp.id) {
          await supabase.from('experiences').update(data).eq('id', exp.id)
        } else {
          await supabase.from('experiences').insert(data)
        }
      }

      onNext()
    } catch (error) {
      console.error('Error saving experiences:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Add your work experience (you can skip this if you don't have any)
        </p>
      </div>

      {experiences.map((exp, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
                Experience #{index + 1}
              </CardTitle>
              {experiences.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={exp.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  placeholder="Tech Corp"
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={exp.location}
                  onChange={(e) => updateExperience(index, 'location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="month"
                  value={exp.start_date}
                  onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="month"
                  value={exp.end_date}
                  onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                  disabled={exp.current}
                />
              </div>

              <div className="space-y-2 flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">I currently work here</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={exp.description}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                placeholder="Describe your responsibilities and achievements..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Proof Link (Optional)</Label>
              <Input
                value={exp.proof_link}
                onChange={(e) => updateExperience(index, 'proof_link', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addExperience}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Experience
      </Button>

      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700"
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
