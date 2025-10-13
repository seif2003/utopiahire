'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Plus, Trash2, GraduationCap, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/client'
import { toast } from 'sonner'

interface Education {
  id?: string
  institution: string
  degree: string
  field_of_study: string
  start_year: string
  end_year: string
  description: string
}

interface EducationStepProps {
  userId: string
  existingData: any[]
  onNext: () => void
}

export function EducationStep({ userId, existingData, onNext }: EducationStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [education, setEducation] = useState<Education[]>(
    existingData.length > 0
      ? existingData.map(edu => ({
          ...edu,
          start_year: String(edu.start_year || ''),
          end_year: String(edu.end_year || ''),
        }))
      : [{
          institution: '',
          degree: '',
          field_of_study: '',
          start_year: '',
          end_year: '',
          description: '',
        }]
  )

  const addEducation = () => {
    setEducation([...education, {
      institution: '',
      degree: '',
      field_of_study: '',
      start_year: '',
      end_year: '',
      description: '',
    }])
  }

  const removeEducation = async (index: number) => {
    const edu = education[index]
    
    if (edu.id) {
      try {
        const supabase = createClient()
        await supabase.from('education').delete().eq('id', edu.id)
      } catch (error) {
        console.error('Error deleting education:', error)
      }
    }
    
    setEducation(education.filter((_, i) => i !== index))
  }

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setEducation(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate: if any field is filled, required fields must be complete
      for (let i = 0; i < education.length; i++) {
        const edu = education[i]
        const hasAnyField = edu.institution || edu.degree || edu.field_of_study || edu.start_year || edu.end_year || edu.description
        
        if (hasAnyField) {
          if (!edu.institution || !edu.degree || !edu.field_of_study) {
            toast.error(`Education #${i + 1}: Please complete all required fields (Institution, Degree, Field of Study) or remove this entry.`)
            setIsLoading(false)
            return
          }
          
          if (!edu.start_year) {
            toast.error(`Education #${i + 1}: Please provide a Start Year.`)
            setIsLoading(false)
            return
          }
        }
      }

      const supabase = createClient()

      // Filter out completely empty education entries
      const validEducation = education.filter(edu => edu.institution && edu.degree)

      for (const edu of validEducation) {
        const data = {
          user_id: userId,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          start_year: parseInt(edu.start_year) || null,
          end_year: parseInt(edu.end_year) || null,
          description: edu.description,
        }

        if (edu.id) {
          await supabase.from('education').update(data).eq('id', edu.id)
        } else {
          await supabase.from('education').insert(data)
        }
      }

      onNext()
    } catch (error) {
      console.error('Error saving education:', error)
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Add your educational background
        </p>
      </div>

      {education.map((edu, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-indigo-600" />
                Education #{index + 1}
              </CardTitle>
              {education.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Institution / University</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="Harvard University"
                />
              </div>

              <div className="space-y-2">
                <Label>Degree</Label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="Bachelor of Science"
                />
              </div>

              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input
                  value={edu.field_of_study}
                  onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                  placeholder="Computer Science"
                />
              </div>

              <div className="space-y-2">
                <Label>Start Year</Label>
                <Input
                  type="number"
                  value={edu.start_year}
                  onChange={(e) => updateEducation(index, 'start_year', e.target.value)}
                  placeholder="2018"
                  min="1950"
                  max="2100"
                />
              </div>

              <div className="space-y-2">
                <Label>End Year</Label>
                <Input
                  type="number"
                  value={edu.end_year}
                  onChange={(e) => updateEducation(index, 'end_year', e.target.value)}
                  placeholder="2022"
                  min="1950"
                  max="2100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={edu.description}
                onChange={(e) => updateEducation(index, 'description', e.target.value)}
                placeholder="Notable courses, thesis, achievements..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addEducation}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Education
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
