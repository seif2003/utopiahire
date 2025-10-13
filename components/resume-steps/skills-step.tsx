'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Plus, Trash2, Zap, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/client'
import { toast } from 'sonner'

interface Skill {
  id?: string
  name: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  verified: boolean
  verification_source: string
}

interface SkillsStepProps {
  userId: string
  existingData: any[]
  onNext: () => void
}

export function SkillsStep({ userId, existingData, onNext }: SkillsStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [skills, setSkills] = useState<Skill[]>(
    existingData.length > 0
      ? existingData
      : [{
          name: '',
          category: '',
          level: 'beginner' as const,
          verified: false,
          verification_source: '',
        }]
  )

  const addSkill = () => {
    setSkills([...skills, {
      name: '',
      category: '',
      level: 'beginner' as const,
      verified: false,
      verification_source: '',
    }])
  }

  const removeSkill = async (index: number) => {
    const skill = skills[index]
    
    if (skill.id) {
      try {
        const supabase = createClient()
        await supabase.from('skills').delete().eq('id', skill.id)
      } catch (error) {
        console.error('Error deleting skill:', error)
      }
    }
    
    setSkills(skills.filter((_, i) => i !== index))
  }

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const updated = [...skills]
    updated[index] = { ...updated[index], [field]: value }
    setSkills(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate: if any field is filled, required fields must be complete
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i]
        const hasAnyField = skill.name || skill.category || skill.verification_source
        
        if (hasAnyField) {
          if (!skill.name) {
            toast.error(`Skill #${i + 1}: Please provide a skill name or remove this entry.`)
            setIsLoading(false)
            return
          }
        }
      }

      const supabase = createClient()

      const validSkills = skills.filter(skill => skill.name)

      for (const skill of validSkills) {
        const data = {
          user_id: userId,
          name: skill.name,
          category: skill.category,
          level: skill.level,
          verified: skill.verified,
          verification_source: skill.verification_source,
        }

        if (skill.id) {
          await supabase.from('skills').update(data).eq('id', skill.id)
        } else {
          await supabase.from('skills').insert(data)
        }
      }

      onNext()
    } catch (error) {
      console.error('Error saving skills:', error)
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Add your skills and expertise
        </p>
      </div>

      {skills.map((skill, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Zap className="h-5 w-5 mr-2 text-indigo-600" />
                Skill #{index + 1}
              </CardTitle>
              {skills.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkill(index)}
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
                <Label>Skill Name</Label>
                <Input
                  value={skill.name}
                  onChange={(e) => updateSkill(index, 'name', e.target.value)}
                  placeholder="Python, UI/UX Design..."
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={skill.category}
                  onChange={(e) => updateSkill(index, 'category', e.target.value)}
                  placeholder="Programming, Design, Marketing..."
                />
              </div>

              <div className="space-y-2">
                <Label>Proficiency Level</Label>
                <select
                  value={skill.level}
                  onChange={(e) => updateSkill(index, 'level', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Verification Link (Optional)</Label>
                <Input
                  value={skill.verification_source}
                  onChange={(e) => updateSkill(index, 'verification_source', e.target.value)}
                  placeholder="Certificate or test URL"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`verified-${index}`}
                checked={skill.verified}
                onChange={(e) => updateSkill(index, 'verified', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor={`verified-${index}`} className="text-sm">
                This skill is verified
              </label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addSkill}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Skill
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
