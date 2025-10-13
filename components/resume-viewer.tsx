'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Code, Upload, Download, Save, Loader2, Eye, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/client'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Dynamically import syntax highlighter to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded">Loading editor...</div>
})

interface ResumeViewerProps {
  userId: string
  resumeUrl: string
  resumeLatex: string | null
  isResumeLatex: boolean
}

export function ResumeViewer({ userId, resumeUrl, resumeLatex, isResumeLatex }: ResumeViewerProps) {
  const [latexCode, setLatexCode] = useState(resumeLatex || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [currentResumeUrl, setCurrentResumeUrl] = useState(resumeUrl)
  const [showLatexTab, setShowLatexTab] = useState(isResumeLatex)
  const [pdfKey, setPdfKey] = useState(0) // For forcing iframe reload

  const fetchLatestResume = async () => {
    try {
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('resume')
        .eq('id', userId)
        .single()

      if (profile?.resume) {
        // Add timestamp to bypass cache
        const newUrl = `${profile.resume}?t=${Date.now()}`
        setCurrentResumeUrl(newUrl)
        setPdfKey(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error fetching latest resume:', error)
    }
  }

  const handleCompileAndSave = async () => {
    setIsCompiling(true)
    setIsSaving(true)
    try {
      // Send LaTeX to n8n for compilation
      // n8n will compile, upload PDF, and update Supabase profiles table
      const response = await fetch('/api/compile-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          latex_code: latexCode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to compile LaTeX')
      }

      const data = await response.json()
      
      // Wait a bit for Supabase to update, then fetch the latest resume
      if (data.success) {
        toast.success('Resume compiled and saved successfully!')
        
        // Wait for Supabase to be updated by n8n
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Fetch the fresh PDF URL from database
        await fetchLatestResume()
      }
    } catch (error: any) {
      console.error('Error compiling LaTeX:', error)
      toast.error(error.message || 'Failed to compile LaTeX. Please check your code.')
    } finally {
      setIsCompiling(false)
      setIsSaving(false)
    }
  }

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()

      // Upload to Supabase Storage
      const fileName = `${userId}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          upsert: true,
          contentType: 'application/pdf',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      // Update profile with new resume URL and set is_resume_latex to false
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          resume: publicUrl,
          is_resume_latex: false 
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setCurrentResumeUrl(publicUrl)
      setShowLatexTab(false)
      toast.success('Resume uploaded successfully!')
      
      // Reload the page to refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Failed to upload resume')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = () => {
    window.open(currentResumeUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Resume</h1>
          <p className="text-gray-600">View, edit, and manage your resume</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>

          {showLatexTab && (
            <Button onClick={fetchLatestResume} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Preview
            </Button>
          )}
          
          <label htmlFor="upload-resume">
            <Button variant="outline" disabled={isUploading} asChild>
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Resume
                  </>
                )}
              </span>
            </Button>
          </label>
          <input
            id="upload-resume"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleUploadResume}
            disabled={isUploading}
          />
        </div>

        {/* Main Content */}
        {showLatexTab ? (
          <Tabs defaultValue="preview" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="latex">
                <Code className="mr-2 h-4 w-4" />
                LaTeX Editor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-indigo-600" />
                    Resume Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full aspect-[8.5/11] bg-white rounded-lg shadow-lg overflow-hidden">
                    <iframe
                      key={pdfKey}
                      src={`${currentResumeUrl}#view=FitH`}
                      className="w-full h-full"
                      title="Resume Preview"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="latex" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* LaTeX Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Code className="mr-2 h-5 w-5 text-indigo-600" />
                        LaTeX Editor
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCompileAndSave}
                          disabled={isSaving || isCompiling}
                          size="sm"
                        >
                          {isSaving || isCompiling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isCompiling ? 'Compiling...' : 'Saving...'}
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Compile & Save as PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Editor
                        height="600px"
                        defaultLanguage="latex"
                        value={latexCode}
                        onChange={(value) => setLatexCode(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          automaticLayout: true,
                          tabSize: 2,
                          folding: true,
                          bracketPairColorization: { enabled: true },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-indigo-600" />
                      PDF Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
                      <iframe
                        key={pdfKey}
                        src={`${currentResumeUrl}#view=FitH`}
                        className="w-full h-full"
                        title="Resume Preview"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      Click "Compile & Save as PDF" to compile your LaTeX and update the preview
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Only PDF preview (no LaTeX)
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-indigo-600" />
                Resume Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-[8.5/11] bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe
                  key={pdfKey}
                  src={`${currentResumeUrl}#view=FitH`}
                  className="w-full h-full"
                  title="Resume Preview"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
