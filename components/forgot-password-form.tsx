'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8', className)} {...props}>
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <Image src="/logo.png" alt="Utopia Hire" width={160} height={60} className="object-contain" />
      </div>

      {success ? (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-sm text-gray-600">
              If you registered using your email and password, you will receive a password reset email.
            </p>
          </div>
          <Link href="/auth/login">
            <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-6 rounded-md">
              Back to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword}>
          <div className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reset Your Password</h2>
              <p className="text-sm text-gray-600">
                Type in your email and we'll send you a link to reset your password
              </p>
            </div>

            {/* Email Address */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-normal">
                Email Address<span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Send Reset Email Button */}
            <Button 
              type="submit" 
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-6 rounded-md mt-2" 
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send reset email'}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm mt-2">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-red-500 hover:text-red-600 font-medium">
                Login
              </Link>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
