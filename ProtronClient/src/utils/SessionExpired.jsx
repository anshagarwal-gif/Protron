import React from 'react'
import { useNavigate } from 'react-router-dom'
import Lottie from 'lottie-react'
import animationData from '../animations/sessionexpired.json'
import { LogIn, RefreshCw, Home } from 'lucide-react'

const SessionExpired = () => {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto text-center relative z-10">
        
        {/* Lottie Animation */}
        <div className=" max-w-md mx-auto">
          <Lottie 
            animationData={animationData} 
            loop={true}
            className="w-full h-[30vh]"
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Session Expired
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Your session has timed out for security reasons. Please log in again to continue using the application.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleLogin}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-48"
            >
              <LogIn className="w-5 h-5" />
              Login Again
            </button>
          </div>

          {/* Info Card */}
          <div className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <p className="text-sm font-semibold text-gray-700">Security Notice</p>
            </div>
            <p className="text-sm text-gray-600">
              Sessions automatically expire after a period of inactivity to protect your account and data.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements - Warning theme */}
      
    </div>
  )
}

export default SessionExpired