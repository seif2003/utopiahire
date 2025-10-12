'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState('')

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first')
      return
    }

    setUploading(true)
    setMessage('Uploading...')

    try {
      // Create FormData to send file to API
      const formData = new FormData()
      formData.append('file', file)

      // Upload via API route (uses service role key on server)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(`Error: ${result.error}`)
        console.error('Upload error:', result)
        return
      }

      setUploadedUrl(result.publicUrl)
      setMessage(`✅ File uploaded successfully!`)
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Supabase Storage Upload</CardTitle>
          <CardDescription>
            Upload files to the 'uploads' bucket via API (server-side with service role key)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              id="fileInput"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !file}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>

          {message && (
            <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
              {message}
            </div>
          )}

          {uploadedUrl && (
            <div className="p-4 bg-gray-100 rounded-lg space-y-2">
              <p className="font-semibold">Public URL:</p>
              <a 
                href={uploadedUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {uploadedUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
