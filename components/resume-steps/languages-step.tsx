'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Plus, Trash2, Globe, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/client'

interface Language {
  id?: string
  language: string
  proficiency: 'beginner' | 'intermediate' | 'fluent' | 'native'
}

interface LanguagesStepProps {
  userId: string
  existingData: any[]
  onNext: () => void
}

export function LanguagesStep({ userId, existingData, onNext }: LanguagesStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [languages, setLanguages] = useState<Language[]>(
    existingData.length > 0
      ? existingData
      : [{
          language: '',
          proficiency: 'beginner' as const,
        }]
  )

  const addLanguage = () => {
    setLanguages([...languages, {
      language: '',
      proficiency: 'beginner' as const,
    }])
  }

  const removeLanguage = async (index: number) => {
    const lang = languages[index]
    
    if (lang.id) {
      try {
        const supabase = createClient()
        await supabase.from('languages').delete().eq('id', lang.id)
      } catch (error) {
        console.error('Error deleting language:', error)
      }
    }
    
    setLanguages(languages.filter((_, i) => i !== index))
  }

  const updateLanguage = (index: number, field: keyof Language, value: any) => {
    const updated = [...languages]
    updated[index] = { ...updated[index], [field]: value }
    setLanguages(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate: if any field is filled, language name must be provided
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i]
        // Since proficiency has a default value, we only need to check if language is filled
        if (!lang.language && lang.proficiency) {
          alert(`Language #${i + 1}: Please provide a language name or remove this entry.`)
          setIsLoading(false)
          return
        }
      }

      const supabase = createClient()

      const validLanguages = languages.filter(lang => lang.language)

      for (const lang of validLanguages) {
        const data = {
          user_id: userId,
          language: lang.language,
          proficiency: lang.proficiency,
        }

        if (lang.id) {
          await supabase.from('languages').update(data).eq('id', lang.id)
        } else {
          await supabase.from('languages').insert(data)
        }
      }

      onNext()
    } catch (error) {
      console.error('Error saving languages:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Add languages you speak
        </p>
      </div>

      {languages.map((lang, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                Language #{index + 1}
              </CardTitle>
              {languages.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLanguage(index)}
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
                <Label>Language</Label>
                <Input
                  value={lang.language}
                  onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                  placeholder="English, Spanish, French..."
                />
              </div>

              <div className="space-y-2">
                <Label>Proficiency Level</Label>
                <select
                  value={lang.proficiency}
                  onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="fluent">Fluent</option>
                  <option value="native">Native</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addLanguage}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Language
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
