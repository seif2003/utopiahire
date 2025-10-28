import { ForgotPasswordForm } from '@/components/forgot-password-form'

export default function Page() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Forgot Password Form */}
      <div className="flex w-full items-center justify-center p-6 md:w-1/2 md:p-10">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
        </div>
      </div>
      
      {/* Right side - Background Image with Testimonial */}
      <div className="hidden md:flex md:w-1/2 relative bg-cover bg-center" style={{ backgroundImage: 'url(/bg1.jpg)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/10" />
        <div className="relative z-10 flex items-end justify-center p-10 w-full">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <div className="flex items-start gap-4">
              <img 
                src="/seif.jpg" 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">Seif Ddine Ben Amara</h3>
                <p className="text-sm text-gray-600 mb-2">Founder of UtopiaHire</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  UtopiaHire is more than a platform — it's a step toward equal chances and ethical hiring.
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-gray-900"></span>
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
