"use client"

import { useState, useEffect } from "react"
import { EyeIcon, EyeOffIcon, MailIcon, UserIcon, PhoneIcon, MapPinIcon, UploadIcon, Loader2 } from "lucide-react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import GlobalSnackbar from "../components/GlobalSnackbar"

const Signup = ({ onSignup, onSwitchToLogin }) => {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [zipLoading, setZipLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
    displayName: "",
    mobileCountryCode: "+91",
    mobileNumber: "",
    landlineCountryCode: "+91",
    landlineNumber: "",
    cost: "",
    costUnit: "USD",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    country: "",
    zipCode: "",
    city: "",
    state: "",
    password: "",
    confirmPassword: "",
    status: "active",
    tenant: sessionStorage.getItem("tenantId"),
    roleId: null,
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // Comprehensive country list
  const countries = [
    { code: "AD", name: "Andorra" },
    { code: "AR", name: "Argentina" },
    { code: "AS", name: "American Samoa" },
    { code: "AT", name: "Austria" },
    { code: "AU", name: "Australia" },
    { code: "BD", name: "Bangladesh" },
    { code: "BE", name: "Belgium" },
    { code: "BG", name: "Bulgaria" },
    { code: "BR", name: "Brazil" },
    { code: "CA", name: "Canada" },
    { code: "CH", name: "Switzerland" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DE", name: "Germany" },
    { code: "DK", name: "Denmark" },
    { code: "DO", name: "Dominican Republic" },
    { code: "ES", name: "Spain" },
    { code: "FI", name: "Finland" },
    { code: "FO", name: "Faroe Islands" },
    { code: "FR", name: "France" },
    { code: "GB", name: "United Kingdom" },
    { code: "GF", name: "French Guiana" },
    { code: "GL", name: "Greenland" },
    { code: "GP", name: "Guadeloupe" },
    { code: "GT", name: "Guatemala" },
    { code: "GU", name: "Guam" },
    { code: "GY", name: "Guyana" },
    { code: "HR", name: "Croatia" },
    { code: "HU", name: "Hungary" },
    { code: "IN", name: "India" },
    { code: "IS", name: "Iceland" },
    { code: "IT", name: "Italy" },
    { code: "JP", name: "Japan" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LK", name: "Sri Lanka" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MC", name: "Monaco" },
    { code: "MD", name: "Moldova" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MK", name: "North Macedonia" },
    { code: "MP", name: "Northern Mariana Islands" },
    { code: "MQ", name: "Martinique" },
    { code: "MX", name: "Mexico" },
    { code: "MY", name: "Malaysia" },
    { code: "NC", name: "New Caledonia" },
    { code: "NL", name: "Netherlands" },
    { code: "NO", name: "Norway" },
    { code: "NZ", name: "New Zealand" },
    { code: "PH", name: "Philippines" },
    { code: "PK", name: "Pakistan" },
    { code: "PL", name: "Poland" },
    { code: "PM", name: "Saint Pierre and Miquelon" },
    { code: "PR", name: "Puerto Rico" },
    { code: "PT", name: "Portugal" },
    { code: "RE", name: "Réunion" },
    { code: "RU", name: "Russia" },
    { code: "SE", name: "Sweden" },
    { code: "SI", name: "Slovenia" },
    { code: "SJ", name: "Svalbard and Jan Mayen" },
    { code: "SK", name: "Slovakia" },
    { code: "SM", name: "San Marino" },
    { code: "TH", name: "Thailand" },
    { code: "TR", name: "Turkey" },
    { code: "US", name: "United States" },
    { code: "VA", name: "Vatican City" },
    { code: "VI", name: "U.S. Virgin Islands" },
    { code: "WF", name: "Wallis and Futuna" },
    { code: "YT", name: "Mayotte" },
    { code: "ZA", name: "South Africa" },
  ]

  // Currency symbols mapping
  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
  }

  // Get current currency symbol
  const getCurrentCurrencySymbol = () => {
    return currencySymbols[formData.costUnit] || "$"
  }

  // Fetch location data from Zippopotam API
  const fetchLocationData = async (country, zipCode) => {
    if (!country || !zipCode || zipCode.length < 4) return

    setZipLoading(true)
    try {
      const response = await axios.get(`http://api.zippopotam.us/${country}/${zipCode}`)
      const data = response.data

      if (data.places && data.places.length > 0) {
        const place = data.places[0]
        setFormData((prev) => ({
          ...prev,
          city: place["place name"] || "",
          state: place["state"] || place["state abbreviation"] || "",
        }))
      }
    } catch (error) {
      console.error("Failed to fetch location data:", error)
      // Clear city and state if API call fails
      setFormData((prev) => ({
        ...prev,
        city: "",
        state: "",
      }))
    } finally {
      setZipLoading(false)
    }
  }

  useEffect(() => {
    // Fetch roles from the API
    const token = sessionStorage.getItem("token")
    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/access/getRoles`, {
          headers: { Authorization: `${token}` },
        })
        setRoles(response.data)
      } catch (error) {
        console.error("Failed to fetch roles:", error)
      }
    }
    fetchRoles()
  }, [])

  // Effect to fetch location data when country or zipCode changes
  useEffect(() => {
    if (formData.country && formData.zipCode) {
      const timeoutId = setTimeout(() => {
        fetchLocationData(formData.country, formData.zipCode)
      }, 500) // Debounce API calls

      return () => clearTimeout(timeoutId)
    }
  }, [formData.country, formData.zipCode])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Handle numeric input for phone numbers
  const handleNumericInput = (e, fieldName) => {
    const value = e.target.value.replace(/\D/g, "") // Remove non-numeric characters
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle role dropdown separately
    if (name === "role") {
      const selectedRole = roles.find((role) => role.roleName === value)
      setFormData((prev) => ({
        ...prev,
        roleId: selectedRole?.roleId || null,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log(formData)

    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.roleId) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const submissionData = new FormData()

    Object.keys(formData).forEach((key) => {
      if (key === "role") {
        submissionData.append(key, JSON.stringify(formData[key]))
      } else {
        submissionData.append(key, formData[key])
      }
    })

    // Add combined phone numbers
    submissionData.append(
      "mobilePhone",
      formData.mobileNumber ? `${formData.mobileCountryCode}${formData.mobileNumber}` : "",
    )
    submissionData.append(
      "lanPhone",
      formData.landlineNumber ? `${formData.landlineCountryCode}${formData.landlineNumber}` : "",
    )

    // Add photo if exists
    if (photo) {
      submissionData.append("profilePhoto", photo)
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/signup`, submissionData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      setSnackbar({
        open: true,
        message: "Signup successful!",
        severity: "success",
      })

      navigate("/users")
    } catch (error) {
      console.error("Signup failed:", error.response?.data || error.message)
      setSnackbar({
        open: true,
        message: error.response?.data || "Signup failed!",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-4xl p-8 my-8">
        <h1 className="text-2xl font-bold text-center text-gray-800">Create Account</h1>
        <p className="text-gray-600 text-center mb-8">Please fill in your information</p>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Dropdown */}
            <div className="md:col-span-3">
              <label htmlFor="role" className="block text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={roles.find((role) => role.roleId === formData.roleId)?.roleName || ""}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.roleName}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Address - Mandatory */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* First Name - Mandatory */}
            <div>
              <label htmlFor="firstName" className="block text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Middle Name */}
            <div>
              <label htmlFor="middleName" className="block text-gray-700 mb-2">
                Middle Name
              </label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                placeholder="Middle name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.middleName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Last Name - Mandatory */}
            <div>
              <label htmlFor="lastName" className="block text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-gray-700 mb-2">
                Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Display name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.displayName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Cost - Updated with dynamic currency symbol */}
            <div>
              <label htmlFor="cost" className="block text-gray-700 mb-2">
                Cost
              </label>
              <div className="flex">
                <select
                  id="costUnit"
                  name="costUnit"
                  className="w-20 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.costUnit}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="AUD">AUD</option>
                </select>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-400 font-medium">{getCurrentCurrencySymbol()}</span>
                  </div>
                  <input
                    id="cost"
                    name="cost"
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.cost}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Phone - Fixed to accept only numbers */}
            <div className="md:col-span-2">
              <label htmlFor="mobileNumber" className="block text-gray-700 mb-2">
                Mobile Phone
              </label>
              <div className="flex">
                <select
                  id="mobileCountryCode"
                  name="mobileCountryCode"
                  className="w-20 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.mobileCountryCode}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                  <option value="+61">+61</option>
                </select>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    placeholder="Mobile number"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.mobileNumber}
                    onChange={(e) => handleNumericInput(e, "mobileNumber")}
                    disabled={loading}
                    maxLength={15}
                  />
                </div>
              </div>
              {/* Preview of combined phone number */}
              {formData.mobileNumber && (
                <p className="text-xs text-gray-600 mt-1">
                  Will be submitted as: {formData.mobileCountryCode}
                  {formData.mobileNumber}
                </p>
              )}
            </div>

            {/* Landline Phone - Fixed to accept only numbers */}
            <div className="md:col-span-1">
              <label htmlFor="landlineNumber" className="block text-gray-700 mb-2">
                Landline
              </label>
              <div className="flex">
                <select
                  id="landlineCountryCode"
                  name="landlineCountryCode"
                  className="w-20 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.landlineCountryCode}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                  <option value="+61">+61</option>
                </select>
                <input
                  id="landlineNumber"
                  name="landlineNumber"
                  type="tel"
                  placeholder="Landline"
                  className="w-full px-4 py-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.landlineNumber}
                  onChange={(e) => handleNumericInput(e, "landlineNumber")}
                  disabled={loading}
                  maxLength={15}
                />
              </div>
              {/* Preview of combined phone number */}
              {formData.landlineNumber && (
                <p className="text-xs text-gray-600 mt-1">
                  Will be submitted as: {formData.landlineCountryCode}
                  {formData.landlineNumber}
                </p>
              )}
            </div>

            {/* Profile Picture */}
            <div className="md:col-span-3">
              <label className="block text-gray-700 mb-2">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <label
                  htmlFor="photo-upload"
                  className={`flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Upload Photo
                </label>
                {photo && <span className="text-sm text-gray-600">{photo.name}</span>}
              </div>
            </div>
          </div>

          {/* Address Fields */}
          <div className="border-t border-b border-gray-200 py-6">
            <h2 className="text-lg font-medium mb-4">Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              

              {/* Country - Comprehensive dropdown */}
              <div>
                <label htmlFor="country" className="block text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zip Code - Triggers Zippopotam API */}
              <div>
                <label htmlFor="zipCode" className="block text-gray-700 mb-2">
                  Zip Code
                  {zipLoading && <Loader2 className="inline h-4 w-4 animate-spin ml-2" />}
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  placeholder="Zip code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* City - Auto-filled from Zippopotam */}
              <div>
                <label htmlFor="city" className="block text-gray-700 mb-2">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="City"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  value={formData.city}
                  onChange={handleChange}
                  readOnly={formData.zipCode && formData.country}
                  disabled={loading}
                />
                {formData.zipCode && formData.country && (
                  <p className="text-xs text-blue-600 mt-1">Auto-filled from zip code</p>
                )}
              </div>

              {/* State - Auto-filled from Zippopotam */}
              <div>
                <label htmlFor="state" className="block text-gray-700 mb-2">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="State"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  value={formData.state}
                  onChange={handleChange}
                  readOnly={formData.zipCode && formData.country}
                  disabled={loading}
                />
                {formData.zipCode && formData.country && (
                  <p className="text-xs text-blue-600 mt-1">Auto-filled from zip code</p>
                )}
              </div>
              {/* Address Line 1 - Character limit added */}
              <div className="md:col-span-3">
                <label htmlFor="addressLine1" className="block text-gray-700 mb-2">
                  Address Line 1<span className="text-sm text-gray-500 ml-2">({formData.addressLine1.length}/100)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    placeholder="Address line 1"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Address Line 2 - Character limit added */}
              <div className="md:col-span-3">
                <label htmlFor="addressLine2" className="block text-gray-700 mb-2">
                  Address Line 2<span className="text-sm text-gray-500 ml-2">({formData.addressLine2.length}/100)</span>
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  type="text"
                  placeholder="Address line 2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              {/* Address Line 3 - Character limit added */}
              <div className="md:col-span-3">
                <label htmlFor="addressLine3" className="block text-gray-700 mb-2">
                  Address Line 3<span className="text-sm text-gray-500 ml-2">({formData.addressLine3.length}/100)</span>
                </label>
                <input
                  id="addressLine3"
                  name="addressLine3"
                  type="text"
                  placeholder="Address line 3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.addressLine3}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>

      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}

export default Signup
