import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'

export default async function ResumeBuilderPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Build Your Resume</h1>
          <p className="text-muted-foreground">
            Let's create a professional resume step by step
          </p>
        </div>

        <div className="rounded-lg border p-8 text-center">
          <p className="text-lg text-muted-foreground">
            Resume builder coming soon...
          </p>
        </div>
      </div>
    </div>
  )
}
