import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Permit Office Search
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600">
            Join thousands of users finding local permit offices in Georgia for building permits, planning, and zoning services.
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="mt-8">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-xl border-0 rounded-2xl',
                headerTitle: 'text-2xl font-bold text-gray-900',
                headerSubtitle: 'text-gray-600',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 normal-case',
                formFieldInput: 'border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors duration-200',
                socialButtonsBlockButtonText: 'text-gray-700 font-medium',
                footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
                identityPreviewText: 'text-gray-700',
                formFieldLabel: 'text-gray-700 font-medium',
                dividerLine: 'bg-gray-200',
                dividerText: 'text-gray-500',
                formResendCodeLink: 'text-blue-600 hover:text-blue-700',
                formFieldSuccessText: 'text-green-600',
                formFieldErrorText: 'text-red-600',
                alertText: 'text-red-600',
                formHeaderTitle: 'text-2xl font-bold text-gray-900',
                formHeaderSubtitle: 'text-gray-600'
              }
            }}
            redirectUrl="/dashboard"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
            initialValues={{
              emailAddress: '',
              password: '',
              firstName: '',
              lastName: ''
            }}
          />
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link 
              href="/sign-in" 
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            <Link 
              href="/forgot-password" 
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
