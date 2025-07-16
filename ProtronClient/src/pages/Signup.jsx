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
    cost_time: "hour",
    unit: "USD",
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
  const [countriesno, setCountriesno] = useState([]);

  // Location-related states
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    zipLookup: false
  })

  const GEONAMES_USERNAME = "bhagirathauti"
  const GEONAMES_BASE_URL = "https://secure.geonames.org"

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
  }

  const timePeriods = [
    { value: "hour", label: "Hourly" },
    { value: "day", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "month", label: "Monthly" },
    { value: "year", label: "Yearly" },
  ]

  const getCurrentCurrencySymbol = () => {
    return currencySymbols[formData.unit] || "$"
  }

  // Load cached countries from localStorage
  const loadCachedCountries = () => {
    const cached = localStorage.getItem('geonames_countries')
    if (cached) {
      try {
        const parsedCountries = JSON.parse(cached)
        const cacheTime = localStorage.getItem('geonames_countries_cache_time')
        const now = Date.now()

        // Cache valid for 7 days
        if (cacheTime && (now - parseInt(cacheTime)) < 7 * 24 * 60 * 60 * 1000) {
          setCountries(parsedCountries)
          return true
        }
      } catch (e) {
        console.error('Error parsing cached countries:', e)
      }
    }
    return false
  }

  // Cache countries to localStorage
  const cacheCountries = (countriesData) => {
    try {
      localStorage.setItem('geonames_countries', JSON.stringify(countriesData))
      localStorage.setItem('geonames_countries_cache_time', Date.now().toString())
    } catch (e) {
      console.error('Error caching countries:', e)
    }
  }
  useEffect(() => {
    axios
      .get("https://restcountries.com/v3.1/all?fields=name,idd,flags")
      .then((res) => {
        const sortedCountries = res.data
          .filter(c => c.idd?.root)
          .map((country) => ({
            name: country.name.common,
            dialCode: country.idd.root + (country.idd.suffixes?.[0] || ""),
            flag: country.flags.png,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountriesno(sortedCountries);
      });
  }, []);
  // Fetch countries from GeoNames API
  const fetchCountries = async () => {
    // Try to load from cache first
    if (loadCachedCountries()) {
      return
    }

    setLocationLoading(prev => ({ ...prev, countries: true }))
    try {
      const response = await axios.get(`${GEONAMES_BASE_URL}/countryInfoJSON?username=${GEONAMES_USERNAME}`)
      const countriesData = response.data.geonames.map(country => ({
        code: country.countryCode,
        name: country.countryName,
        geonameId: country.geonameId
      })).sort((a, b) => a.name.localeCompare(b.name))

      setCountries(countriesData)
      cacheCountries(countriesData)
    } catch (error) {
      console.error("Failed to fetch countries:", error)
      setSnackbar({
        open: true,
        message: "Failed to load countries. Please try again.",
        severity: "error",
      })
    } finally {
      setLocationLoading(prev => ({ ...prev, countries: false }))
    }
  }

  // Fetch states for selected country
  const fetchStates = async (countryCode) => {
    const country = countries.find(c => c.code === countryCode)
    if (!country) return

    setLocationLoading(prev => ({ ...prev, states: true }))
    try {
      const response = await axios.get(`${GEONAMES_BASE_URL}/childrenJSON?geonameId=${country.geonameId}&username=${GEONAMES_USERNAME}`)
      const statesData = response.data.geonames.map(state => ({
        code: state.adminCode1,
        name: state.name,
        geonameId: state.geonameId
      })).sort((a, b) => a.name.localeCompare(b.name))

      setStates(statesData)
    } catch (error) {
      console.error("Failed to fetch states:", error)
      setSnackbar({
        open: true,
        message: "Failed to load states. Please try again.",
        severity: "error",
      })
    } finally {
      setLocationLoading(prev => ({ ...prev, states: false }))
    }
  }

  // Fetch cities for selected state
  const fetchCities = async (countryCode, stateCode) => {
    setLocationLoading(prev => ({ ...prev, cities: true }))
    try {
      const response = await axios.get(`${GEONAMES_BASE_URL}/searchJSON?country=${countryCode}&adminCode1=${stateCode}&featureClass=P&maxRows=1000&username=${GEONAMES_USERNAME}`)
      const citiesData = response.data.geonames.map(city => ({
        name: city.name,
        geonameId: city.geonameId,
        postalCodes: city.postalCodes || []
      })).sort((a, b) => a.name.localeCompare(b.name))

      setCities(citiesData)
    } catch (error) {
      console.error("Failed to fetch cities:", error)
      setSnackbar({
        open: true,
        message: "Failed to load cities. Please try again.",
        severity: "error",
      })
    } finally {
      setLocationLoading(prev => ({ ...prev, cities: false }))
    }
  }
  // Lookup location by ZIP code
  const lookupByZipCode = async (zipCode, countryCode) => {
    if (!zipCode || !countryCode) return

    setLocationLoading(prev => ({ ...prev, zipLookup: true }))
    try {
      const response = await axios.get(`${GEONAMES_BASE_URL}/postalCodeSearchJSON?postalcode=${zipCode}&country=${countryCode}&username=${GEONAMES_USERNAME}`)

      if (response.data.postalCodes && response.data.postalCodes.length > 0) {
        const result = response.data.postalCodes[0]

        // Update form data with found location
        setFormData(prev => ({
          ...prev,
          state: result.adminName1 || "",
          city: result.placeName || ""
        }))

        // Fetch states for the country if not already loaded
        if (states.length === 0) {
          await fetchStates(countryCode)
        }

        // Find and fetch cities for the state
        const stateCode = result.adminCode1
        if (stateCode) {
          await fetchCities(countryCode, stateCode)
        }
      }
    } catch (error) {
      console.error("Failed to lookup ZIP code:", error)
      setSnackbar({
        open: true,
        message: "Failed to lookup ZIP code. Please try again.",
        severity: "error",
      })
    } finally {
      setLocationLoading(prev => ({ ...prev, zipLookup: false }))
    }
  }

  // Handle ZIP code autofill based on city selection
  const handleCitySelection = (cityName) => {
    const city = cities.find(c => c.name === cityName)
    if (city && city.postalCodes && city.postalCodes.length > 0) {
      setFormData(prev => ({
        ...prev,
        city: cityName,
        zipCode: city.postalCodes[0]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        city: cityName
      }))
    }
  }

  useEffect(() => {
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
    fetchCountries()
  }, [])

  // Handle country change
  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country)
      setStates([])
      setCities([])
      setFormData(prev => ({
        ...prev,
        state: "",
        city: ""
      }))
    }
  }, [formData.country])

  // Handle state change
  useEffect(() => {
    if (formData.country && formData.state) {
      const state = states.find(s => s.name === formData.state)
      if (state) {
        fetchCities(formData.country, state.code)
        setFormData(prev => ({
          ...prev,
          city: ""
        }))
      }
    }
  }, [formData.state])

  // Handle ZIP code change for lookup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.zipCode && formData.country && formData.zipCode.length >= 3) {
        lookupByZipCode(formData.zipCode, formData.country)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [formData.zipCode, formData.country])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleNumericInput = (e, fieldName) => {
    const value = e.target.value.replace(/\D/g, "") // Remove non-numeric characters
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "role") {
      const selectedRole = roles.find((role) => role.roleName === value)
      setFormData((prev) => ({
        ...prev,
        roleId: selectedRole?.roleId || null,
      }))
    } else if (name === "city") {
      handleCitySelection(value)
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
    console.log("Form Data before submission:", formData)
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

    // Add all form fields explicitly to ensure costUnit is included
    Object.keys(formData).forEach((key) => {
      if (key !== "role") {
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

    // Debug: Log what's being sent
    console.log("Submission data:")
    for (let [key, value] of submissionData.entries()) {
      console.log(key, value)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 w-full max-w-6xl p-6 my-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-slate-600 mt-1 text-sm">Please fill in your information to get started</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Role Dropdown */}
            <div className="md:col-span-4">
              <label htmlFor="role" className="block text-slate-700 font-medium mb-2 text-sm">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
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

            {/* Email Address */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-slate-700 font-medium mb-2 text-sm">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MailIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-slate-700 font-medium mb-2 text-sm">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Middle Name */}
            <div>
              <label htmlFor="middleName" className="block text-slate-700 font-medium mb-2 text-sm">
                Middle Name
              </label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                placeholder="Middle name"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                value={formData.middleName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-slate-700 font-medium mb-2 text-sm">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last name"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-slate-700 font-medium mb-2 text-sm">
                Display Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Display name"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.displayName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Cost */}
            <div>
              <label htmlFor="cost" className="block text-slate-700 font-medium mb-2 text-sm">
                Cost
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white/50 backdrop-blur-sm hover:border-slate-300 transition-all duration-200">
                <select
                  id="unit"
                  name="unit"
                  className="w-16 text-xs border-0 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  value={formData.unit}
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
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <span className="text-slate-400 font-medium text-sm">{getCurrentCurrencySymbol()}</span>
                  </div>
                  <input
                    id="cost"
                    name="cost"
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-8 pr-2 py-2.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 bg-transparent"
                    value={formData.cost}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Cost Time Period */}
            <div>
              <label htmlFor="cost_time" className="block text-slate-700 font-medium mb-2 text-sm">
                Cost Period
              </label>
              <select
                id="cost_time"
                name="cost_time"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                value={formData.cost_time}
                onChange={handleChange}
                disabled={loading}
              >
                {timePeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Phone */}
            <div className="md:col-span-2">
              <label htmlFor="mobileNumber" className="block text-slate-700 font-medium mb-2 text-sm">
                Mobile Phone
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white/50 backdrop-blur-sm hover:border-slate-300 transition-all duration-200">
                <select
                  id="mobileCountryCode"
                  name="mobileCountryCode"
                  className="w-15 text-xs border-0 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white pr-2"
                  value={formData.mobileCountryCode}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {countriesno.map((country, index) => (
                    <option key={index} value={country.dialCode}>
                      {country.dialCode}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <PhoneIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    placeholder="Mobile number"
                    className="w-full pl-8 pr-3 py-2.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 bg-transparent"
                    value={formData.mobileNumber}
                    onChange={(e) => handleNumericInput(e, "mobileNumber")}
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
              </div>
              {formData.mobileNumber && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Will be submitted as: {formData.mobileCountryCode}{formData.mobileNumber}
                </p>
              )}
            </div>

            {/* Landline Phone */}
            <div className="md:col-span-2">
              <label htmlFor="landlineNumber" className="block text-slate-700 font-medium mb-2 text-sm">
                Landline
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white/50 backdrop-blur-sm hover:border-slate-300 transition-all duration-200">
                <select
                  id="landlineCountryCode"
                  name="landlineCountryCode"
                  className="w-16 text-xs border-0 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  value={formData.landlineCountryCode}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {countriesno.map((country, index) => (
                    <option key={index} value={country.dialCode}>
                      {country.dialCode}
                    </option>
                  ))}
                </select>
                <input
                  id="landlineNumber"
                  name="landlineNumber"
                  type="tel"
                  placeholder="Landline"
                  className="w-full px-3 py-2.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 bg-transparent"
                  value={formData.landlineNumber}
                  onChange={(e) => handleNumericInput(e, "landlineNumber")}
                  disabled={loading}
                  maxLength={15}
                />
              </div>
              {formData.landlineNumber && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  Will be submitted as: {formData.landlineCountryCode}{formData.landlineNumber}
                </p>
              )}
            </div>

            {/* Profile Picture */}
            <div className="md:col-span-4">
              <label className="block text-slate-700 font-medium mb-2 text-sm">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                    {photoPreview ? (
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <UploadIcon className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
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
                    className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-200 border border-blue-200 text-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload Photo
                  </label>
                  {photo && <span className="text-xs text-slate-600 ml-3">{photo.name}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-6 border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-blue-500" />
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-slate-700 font-medium mb-2 text-sm">
                  Country
                  {locationLoading.countries && <Loader2 className="inline h-4 w-4 animate-spin ml-2 text-blue-500" />}
                </label>
                <select
                  id="country"
                  name="country"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 disabled:opacity-50"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading || locationLoading.countries}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-slate-700 font-medium mb-2 text-sm">
                  State
                  {locationLoading.states && <Loader2 className="inline h-4 w-4 animate-spin ml-2 text-blue-500" />}
                </label>
                <select
                  id="state"
                  name="state"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 disabled:opacity-50"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={loading || locationLoading.states || !formData.country}
                >
                  <option value="">Select state</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {!formData.country && (
                  <p className="text-xs text-slate-500 mt-1">Select a country first</p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-slate-700 font-medium mb-2 text-sm">
                  City
                  {locationLoading.cities && <Loader2 className="inline h-4 w-4 animate-spin ml-2 text-blue-500" />}
                </label>
                <select
                  id="city"
                  name="city"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 disabled:opacity-50"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading || locationLoading.cities || !formData.state}
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city.geonameId} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {!formData.state && (
                  <p className="text-xs text-slate-500 mt-1">Select a state first</p>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <label htmlFor="zipCode" className="block text-slate-700 font-medium mb-2 text-sm">
                  ZIP Code
                  {locationLoading.zipLookup && <Loader2 className="inline h-4 w-4 animate-spin ml-2 text-blue-500" />}
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  placeholder="Enter ZIP code"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={loading}
                />
                {formData.country && formData.zipCode && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    {countries.find(c => c.code === formData.country)?.name}
                  </p>
                )}
              </div>

              {/* Address Line 1 */}
              <div className="md:col-span-3">
                <label htmlFor="addressLine1" className="block text-slate-700 font-medium mb-2 text-sm">
                  Address Line 1
                  <span className="text-sm text-slate-500 ml-2 font-normal">
                    ({formData.addressLine1.length}/100)
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MapPinIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    placeholder="Street address, building, etc."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Address Line 2 */}
              <div className="md:col-span-3">
                <label htmlFor="addressLine2" className="block text-slate-700 font-medium mb-2 text-sm">
                  Address Line 2
                  <span className="text-sm text-slate-500 ml-2 font-normal">
                    ({formData.addressLine2.length}/100)
                  </span>
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  type="text"
                  placeholder="Apartment, suite, unit, etc. (optional)"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              {/* Address Line 3 */}
              <div className="md:col-span-3">
                <label htmlFor="addressLine3" className="block text-slate-700 font-medium mb-2 text-sm">
                  Address Line 3
                  <span className="text-sm text-slate-500 ml-2 font-normal">
                    ({formData.addressLine3.length}/100)
                  </span>
                </label>
                <input
                  id="addressLine3"
                  name="addressLine3"
                  type="text"
                  placeholder="Additional address information (optional)"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.addressLine3}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={100}
                />
              </div>
            </div>
          </div>


          {/* Password Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-slate-700 font-medium mb-3">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-slate-700 font-medium mb-3">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span className="font-medium">Create Account</span>
                  <div className="ml-2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </>
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