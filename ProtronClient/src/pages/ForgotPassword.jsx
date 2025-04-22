import React, { useState, useEffect } from 'react';
import { MailIcon, KeyIcon, LockIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react';
import axios from 'axios';

// Forgot Password steps
const STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  NEW_PASSWORD: 'new_password',
  SUCCESS: 'success'
};

const ForgotPassword = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, { email });
      setSuccess('OTP sent to your email');
      setCurrentStep(STEPS.OTP);
      setTimer(120); // 2 minutes countdown
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('OTP is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { 
        email, 
        otp 
      });
      setSuccess('OTP verified successfully');
      setCurrentStep(STEPS.NEW_PASSWORD);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
        email,
        otp,
        newPassword
      });
      setSuccess('Password updated successfully');
      setCurrentStep(STEPS.SUCCESS);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, { email });
      setSuccess('OTP resent to your email');
      setTimer(300); // 5 minutes countdown
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render email step form
  const renderEmailStep = () => (
    <form onSubmit={handleSendOTP}>
      <div className="mb-6">
        <label htmlFor="email" className="block text-gray-700 mb-2">Enter your email address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MailIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
      >
        {loading ? 'Sending...' : 'Send OTP'}
      </button>
    </form>
  );

  // Render OTP step form
  const renderOTPStep = () => (
    <form onSubmit={handleVerifyOTP}>
      <div className="mb-6">
        <label htmlFor="otp" className="block text-gray-700 mb-2">Enter OTP sent to your email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <KeyIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="otp"
            type="text"
            placeholder="Enter OTP"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={6}
            required
          />
        </div>
      </div>

      <div className="mb-6 text-sm text-gray-600 flex justify-between items-center">
        <span>
          {timer > 0 ? `Resend OTP in ${timer}s` : 'Didn\'t receive OTP?'}
        </span>
        <button
          type="button"
          onClick={resendOTP}
          disabled={timer > 0 || loading}
          className={`text-blue-600 ${timer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
        >
          Resend OTP
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
    </form>
  );

  // Render new password step form
  const renderNewPasswordStep = () => (
    <form onSubmit={handleResetPassword}>
      <div className="mb-6">
        <label htmlFor="newPassword" className="block text-gray-700 mb-2">New Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <LockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Confirm Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <LockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
      >
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Password Reset Successful</h3>
      <p className="text-gray-600 mb-6">Your password has been updated successfully.</p>
      <button
        onClick={onBack}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Back to Login
      </button>
    </div>
  );

  // Get step title based on current step
  const getStepTitle = () => {
    switch (currentStep) {
      case STEPS.EMAIL:
        return 'Forgot Password';
      case STEPS.OTP:
        return 'Verify OTP';
      case STEPS.NEW_PASSWORD:
        return 'Reset Password';
      case STEPS.SUCCESS:
        return 'Success';
      default:
        return 'Forgot Password';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
      <div className="flex items-center mb-6">
        {currentStep !== STEPS.SUCCESS && (
          <button
            onClick={onBack}
            className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{getStepTitle()}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && currentStep !== STEPS.SUCCESS && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {currentStep === STEPS.EMAIL && renderEmailStep()}
      {currentStep === STEPS.OTP && renderOTPStep()}
      {currentStep === STEPS.NEW_PASSWORD && renderNewPasswordStep()}
      {currentStep === STEPS.SUCCESS && renderSuccessStep()}
    </div>
  );
};

export default ForgotPassword;