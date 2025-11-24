"use client"

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface VerificationState {
  status: 'loading' | 'success' | 'error'
  message: string
  userData?: {
    email: string
    firstName: string
    lastName: string
  }
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying your email address...'
  })

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setVerificationState({
          status: 'error',
          message: 'No verification token provided. Please check your email link.'
        })
        return
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include',
        })

        const data = await response.json()

        if (data.success) {
          setVerificationState({
            status: 'success',
            message: data.message || 'Email verified successfully! Welcome to MySeatMap.',
            userData: data.data
          })
        } else {
          setVerificationState({
            status: 'error',
            message: data.message || 'Email verification failed. The link may be expired or invalid.'
          })
        }
      } catch (error) {
        setVerificationState({
          status: 'error',
          message: 'Something went wrong while verifying your email. Please try again.'
        })
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleContinue = () => {
    router.push('/dashboard')
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 text-center">
          {/* Loading State */}
          {verificationState.status === 'loading' && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Verifying Your Email
                </h1>
                <p className="text-gray-600">
                  {verificationState.message}
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {verificationState.status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Verified Successfully!
                </h1>
                <p className="text-gray-600 mb-4">
                  {verificationState.message}
                </p>
                {verificationState.userData && (
                  <p className="text-sm text-gray-500">
                    Welcome, {verificationState.userData.firstName}! Your account is now active.
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleContinue}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-3 cursor-pointer"
                >
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <div className="text-sm text-gray-500">
                  Or{' '}
                  <Link href="/search" className="text-teal-600 hover:text-teal-700 font-medium">
                    start searching flights
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {verificationState.status === 'error' && (
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Verification Failed
                </h1>
                <p className="text-gray-600">
                  {verificationState.message}
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="w-full rounded-full py-3 cursor-pointer"
                >
                  Back to Login
                </Button>
                
                <div className="text-sm text-gray-500">
                  Need help?{' '}
                  <Link href="/contact" className="text-teal-600 hover:text-teal-700 font-medium">
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Additional Help Section */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              What happens next?
            </h3>
            <p className="text-sm text-blue-700">
              Once verified, you can search flights, save bookmarks, and set up alerts for seat availability changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}