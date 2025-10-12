'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Plus, Trash2, Award, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/client'

interface Certification {
  id?: string
  name: string
  issuer: string
  year: string
  credential_url: string
}

interface CertificationsStepProps {
  userId: string
  existingData: any[]
  onNext: () => void
}

export function CertificationsStep({ userId, existingData, onNext }: CertificationsStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [certifications, setCertifications] = useState<Certification[]>(
    existingData.length > 0
      ? existingData.map(cert => ({
          ...cert,
          year: String(cert.year || ''),
        }))
      : [{
          name: '',
          issuer: '',
          year: '',
          credential_url: '',
        }]
  )

  const addCertification = () => {
    setCertifications([...certifications, {
      name: '',
      issuer: '',
      year: '',
      credential_url: '',
    }])
  }

  const removeCertification = async (index: number) => {
    const cert = certifications[index]
    
    if (cert.id) {
      try {
        const supabase = createClient()
        await supabase.from('certifications').delete().eq('id', cert.id)
      } catch (error) {
        console.error('Error deleting certification:', error)
      }
    }
    
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    const updated = [...certifications]
    updated[index] = { ...updated[index], [field]: value }
    setCertifications(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate: if any field is filled, required fields must be complete
      for (let i = 0; i < certifications.length; i++) {
        const cert = certifications[i]
        const hasAnyField = cert.name || cert.issuer || cert.year || cert.credential_url
        
        if (hasAnyField) {
          if (!cert.name || !cert.issuer) {
            alert(`Certification #${i + 1}: Please provide both Certification Name and Issuing Organization, or remove this entry.`)
            setIsLoading(false)
            return
          }
          
          if (!cert.year) {
            alert(`Certification #${i + 1}: Please provide the Year Obtained.`)
            setIsLoading(false)
            return
          }
        }
      }

      const supabase = createClient()

      const validCertifications = certifications.filter(cert => cert.name && cert.issuer)

      for (const cert of validCertifications) {
        const data = {
          user_id: userId,
          name: cert.name,
          issuer: cert.issuer,
          year: parseInt(cert.year) || new Date().getFullYear(),
          credential_url: cert.credential_url,
        }

        if (cert.id) {
          await supabase.from('certifications').update(data).eq('id', cert.id)
        } else {
          await supabase.from('certifications').insert(data)
        }
      }

      onNext()
    } catch (error) {
      console.error('Error saving certifications:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Add your certifications and credentials (optional)
        </p>
      </div>

      {certifications.map((cert, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Award className="h-5 w-5 mr-2 text-indigo-600" />
                Certification #{index + 1}
              </CardTitle>
              {certifications.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCertification(index)}
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
                <Label>Certification Name</Label>
                <Input
                  value={cert.name}
                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                  placeholder="AWS Certified Solutions Architect"
                />
              </div>

              <div className="space-y-2">
                <Label>Issuing Organization</Label>
                <Input
                  value={cert.issuer}
                  onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                  placeholder="Amazon Web Services"
                />
              </div>

              <div className="space-y-2">
                <Label>Year Obtained</Label>
                <Input
                  type="number"
                  value={cert.year}
                  onChange={(e) => updateCertification(index, 'year', e.target.value)}
                  placeholder="2024"
                  min="1950"
                  max="2100"
                />
              </div>

              <div className="space-y-2">
                <Label>Credential URL (Optional)</Label>
                <Input
                  value={cert.credential_url}
                  onChange={(e) => updateCertification(index, 'credential_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addCertification}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Certification
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
