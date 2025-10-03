'use client'

import { useUser } from '@clerk/nextjs'

export default function TestClerkPage() {
  const { isLoaded, isSignedIn, user } = useUser()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Clerk Test Page</h1>

        <div className="space-y-4">
          <div className="border-b pb-2">
            <p className="font-semibold">Clerk Status:</p>
            <p>Is Loaded: {isLoaded ? '✅ Yes' : '❌ No'}</p>
            <p>Is Signed In: {isSignedIn ? '✅ Yes' : '❌ No'}</p>
          </div>

          {isLoaded && user && (
            <div className="border-b pb-2">
              <p className="font-semibold">User Info:</p>
              <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
              <p>Name: {user.fullName}</p>
              <p>User ID: {user.id}</p>
            </div>
          )}

          <div className="border-b pb-2">
            <p className="font-semibold">Environment Variables:</p>
            <p>Publishable Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>

          <div>
            <p className="font-semibold">Test Input Field:</p>
            <input
              type="text"
              placeholder="Type here to test input..."
              className="w-full border border-gray-300 rounded px-3 py-2 mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
