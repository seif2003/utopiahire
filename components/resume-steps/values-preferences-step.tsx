'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, Plus, X, Heart, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/client'

interface ValuesPreferences {
  id?: string
  core_values: string[]
  preferred_culture: string[]
  open_to_relocation: boolean
  desired_industries: string[]
}

interface ValuesPreferencesStepProps {
  userId: string
  existingData: any
  onNext: () => void
}

export function ValuesPreferencesStep({ userId, existingData, onNext }: ValuesPreferencesStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [values, setValues] = useState<ValuesPreferences>({
    id: existingData?.id,
    core_values: existingData?.core_values || [],
    preferred_culture: existingData?.preferred_culture || [],
    open_to_relocation: existingData?.open_to_relocation || false,
    desired_industries: existingData?.desired_industries || [],
  })

  const [newValue, setNewValue] = useState('')
  const [newCulture, setNewCulture] = useState('')
  const [newIndustry, setNewIndustry] = useState('')

  const addValue = () => {
    if (newValue.trim()) {
      setValues({
        ...values,
        core_values: [...values.core_values, newValue.trim()],
      })
      setNewValue('')
    }
  }

  const removeValue = (index: number) => {
    setValues({
      ...values,
      core_values: values.core_values.filter((_, i) => i !== index),
    })
  }

  const addCulture = () => {
    if (newCulture.trim()) {
      setValues({
        ...values,
        preferred_culture: [...values.preferred_culture, newCulture.trim()],
      })
      setNewCulture('')
    }
  }

  const removeCulture = (index: number) => {
    setValues({
      ...values,
      preferred_culture: values.preferred_culture.filter((_, i) => i !== index),
    })
  }

  const addIndustry = () => {
    if (newIndustry.trim()) {
      setValues({
        ...values,
        desired_industries: [...values.desired_industries, newIndustry.trim()],
      })
      setNewIndustry('')
    }
  }

  const removeIndustry = (index: number) => {
    setValues({
      ...values,
      desired_industries: values.desired_industries.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const data = {
        user_id: userId,
        core_values: values.core_values,
        preferred_culture: values.preferred_culture,
        open_to_relocation: values.open_to_relocation,
        desired_industries: values.desired_industries,
      }

      if (values.id) {
        await supabase.from('values_and_preferences').update(data).eq('id', values.id)
      } else {
        await supabase.from('values_and_preferences').insert(data)
      }

      onNext()
    } catch (error) {
      console.error('Error saving values and preferences:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-6 w-6 text-indigo-600" />
        <p className="text-sm text-gray-600">
          Tell us about your values and work preferences (optional)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Core Values */}
          <div className="space-y-3">
            <Label>Core Values</Label>
            <p className="text-sm text-gray-500">What matters most to you in your work?</p>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g., Innovation, Teamwork, Integrity..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addValue()
                  }
                }}
              />
              <Button type="button" onClick={addValue} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {values.core_values.map((value, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(index)}
                    className="hover:text-indigo-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Culture */}
          <div className="space-y-3">
            <Label>Preferred Company Culture</Label>
            <p className="text-sm text-gray-500">What kind of work environment do you thrive in?</p>
            <div className="flex gap-2">
              <Input
                value={newCulture}
                onChange={(e) => setNewCulture(e.target.value)}
                placeholder="e.g., Remote-first, Inclusive, Fast-paced..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCulture()
                  }
                }}
              />
              <Button type="button" onClick={addCulture} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {values.preferred_culture.map((culture, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {culture}
                  <button
                    type="button"
                    onClick={() => removeCulture(index)}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Desired Industries */}
          <div className="space-y-3">
            <Label>Desired Industries</Label>
            <p className="text-sm text-gray-500">Which industries interest you?</p>
            <div className="flex gap-2">
              <Input
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                placeholder="e.g., Tech, Healthcare, Finance..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addIndustry()
                  }
                }}
              />
              <Button type="button" onClick={addIndustry} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {values.desired_industries.map((industry, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {industry}
                  <button
                    type="button"
                    onClick={() => removeIndustry(index)}
                    className="hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Relocation */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="relocation"
              checked={values.open_to_relocation}
              onChange={(e) => setValues({ ...values, open_to_relocation: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="relocation" className="text-sm font-medium cursor-pointer">
              I am open to relocation for the right opportunity
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              Complete Profile
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
