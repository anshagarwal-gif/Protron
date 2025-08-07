import React from 'react'
import Lottie from "lottie-react"
import animationData from "../animations/pagenotfound.json"
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const PageNotFound = () => {
  const navigate = useNavigate()

  const handleNavigateToDashboard = () => {
    navigate('/dashboard')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className=" flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto text-center relative z-10">
        
        {/* Lottie Animation */}
        <div className="mb-8 max-w-md mx-auto">
          <Lottie 
            animationData={animationData} 
            loop={true}
            className="w-full h-[40vh] max-h-96"
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Oops! Page Not Found
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for seems to have wandered off into the digital void. 
            Don't worry, it happens to the best of us!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleNavigateToDashboard}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 min-w-48"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </button>
            
            
          </div>

          {/* Help Text */}
          
        </div>
      </div>

      {/* Decorative Background Elements */}
      
    </div>
  )
}

export default PageNotFound