import React from 'react'
import { useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import animationData from '../animations/unauthorized.json'
import { LogIn, ArrowLeft, Home } from 'lucide-react'

// Mock Lottie component for demonstration


const Unauthorized = () => {
  // In your actual implementation, replace these with your router navigation
  const handleLogin = () => {
    // navigate('/login')
    console.log('Navigating to login...')
  }

  const handleGoBack = () => {
    // navigate(-1)
    window.history.back()
  }

  const handleGoHome = () => {
    // navigate('/')
    console.log('Navigating to home...')
  }

  return (
    <div className="bg-white flex flex-col items-center justify-center p-4 mt-10">
      
      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto text-center">
        
        {/* Lottie Animation - Replace MockLottie with your actual Lottie component */}
        <div className="mb-8 max-w-md mx-auto">
          <Lottie 
            animationData={animationData} 
            loop={true}
            className="w-full h-[20vh]"
          />
         
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            You don't have permission to access this page. Please check your credentials or contact your administrator.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            
            
            <button
              onClick={handleGoBack}
              className="bg-green-600 hover:bg-green-700  text-white font-semibold py-3 px-3 rounded-lg shadow-sm transform hover:scale-105 transition-all duration-200 flex justify-around items-center min-w-30"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
            
            
          </div>

          {/* Info Card */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-800">Access Restriction</p>
            </div>
            <p className="text-sm text-gray-600">
              This content is protected and requires appropriate permissions to view.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized