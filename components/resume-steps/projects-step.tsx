'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, Plus, Trash2, Folder, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/client'
import { toast } from 'sonner'

interface Project {
  id?: string
  title: string
  description: string
  tech_stack: string[]
  role: string
  links: string[]
  impact: string
}

interface ProjectsStepProps {
  userId: string
  existingData: any[]
  onNext: () => void
}

export function ProjectsStep({ userId, existingData, onNext }: ProjectsStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>(
    existingData.length > 0
      ? existingData
      : [{
          title: '',
          description: '',
          tech_stack: [],
          role: '',
          links: [],
          impact: '',
        }]
  )

  const [newTech, setNewTech] = useState<{ [key: number]: string }>({})
  const [newLink, setNewLink] = useState<{ [key: number]: string }>({})

  const addProject = () => {
    setProjects([...projects, {
      title: '',
      description: '',
      tech_stack: [],
      role: '',
      links: [],
      impact: '',
    }])
  }

  const removeProject = async (index: number) => {
    const project = projects[index]
    
    if (project.id) {
      try {
        const supabase = createClient()
        await supabase.from('projects').delete().eq('id', project.id)
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
    
    setProjects(projects.filter((_, i) => i !== index))
  }

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  const addTech = (index: number) => {
    if (newTech[index]?.trim()) {
      const updated = [...projects]
      updated[index].tech_stack = [...updated[index].tech_stack, newTech[index].trim()]
      setProjects(updated)
      setNewTech({ ...newTech, [index]: '' })
    }
  }

  const removeTech = (projectIndex: number, techIndex: number) => {
    const updated = [...projects]
    updated[projectIndex].tech_stack = updated[projectIndex].tech_stack.filter((_, i) => i !== techIndex)
    setProjects(updated)
  }

  const addLink = (index: number) => {
    if (newLink[index]?.trim()) {
      const updated = [...projects]
      updated[index].links = [...updated[index].links, newLink[index].trim()]
      setProjects(updated)
      setNewLink({ ...newLink, [index]: '' })
    }
  }

  const removeLink = (projectIndex: number, linkIndex: number) => {
    const updated = [...projects]
    updated[projectIndex].links = updated[projectIndex].links.filter((_, i) => i !== linkIndex)
    setProjects(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate: if any field is filled, required fields must be complete
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i]
        const hasAnyField = project.title || project.description || project.role || project.tech_stack.length > 0 || project.links.length > 0 || project.impact
        
        if (hasAnyField) {
          if (!project.title) {
            toast.error(`Project #${i + 1}: Please provide a project title or remove this entry.`)
            setIsLoading(false)
            return
          }
        }
      }

      const supabase = createClient()

      const validProjects = projects.filter(project => project.title)

      for (const project of validProjects) {
        const data = {
          user_id: userId,
          title: project.title,
          description: project.description,
          tech_stack: project.tech_stack,
          role: project.role,
          links: project.links,
          impact: project.impact,
        }

        if (project.id) {
          await supabase.from('projects').update(data).eq('id', project.id)
        } else {
          await supabase.from('projects').insert(data)
        }
      }

      onNext()
    } catch (error) {
      console.error('Error saving projects:', error)
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Add your projects and portfolio items
        </p>
      </div>

      {projects.map((project, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Folder className="h-5 w-5 mr-2 " />
                Project #{index + 1}
              </CardTitle>
              {projects.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProject(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                value={project.title}
                onChange={(e) => updateProject(index, 'title', e.target.value)}
                placeholder="E-commerce Platform"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={project.description}
                onChange={(e) => updateProject(index, 'description', e.target.value)}
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Your Role</Label>
              <Input
                value={project.role}
                onChange={(e) => updateProject(index, 'role', e.target.value)}
                placeholder="Full-stack Developer, Lead Designer..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <div className="flex gap-2">
                <Input
                  value={newTech[index] || ''}
                  onChange={(e) => setNewTech({ ...newTech, [index]: e.target.value })}
                  placeholder="Add technology..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTech(index)
                    }
                  }}
                />
                <Button type="button" onClick={() => addTech(index)} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.tech_stack.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-indigo-700 rounded-full text-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(index, techIndex)}
                      className="hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Links (GitHub, Live Demo, etc.)</Label>
              <div className="flex gap-2">
                <Input
                  value={newLink[index] || ''}
                  onChange={(e) => setNewLink({ ...newLink, [index]: e.target.value })}
                  placeholder="Add link..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addLink(index)
                    }
                  }}
                />
                <Button type="button" onClick={() => addLink(index)} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 mt-2">
                {project.links.map((link, linkIndex) => (
                  <div
                    key={linkIndex}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer" className=" hover:underline truncate">
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(index, linkIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Impact / Results (Optional)</Label>
              <Textarea
                value={project.impact}
                onChange={(e) => updateProject(index, 'impact', e.target.value)}
                placeholder="What was the outcome? Metrics, achievements..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addProject}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Project
      </Button>

      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          
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
