"use client"

import { useState, useEffect } from "react"
import { EyeIcon, EyeOffIcon, MailIcon, UserIcon, PhoneIcon, MapPinIcon, UploadIcon, Loader2, Mail } from "lucide-react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import GlobalSnackbar from "../components/GlobalSnackbar"
import * as XLSX from "xlsx"

const Signup = () => {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
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

  // --- Bulk user creation state ---
  const [mode, setMode] = useState("single") // "single" | "bulk"
  const [bulkUsers, setBulkUsers] = useState([]) // Parsed + validated rows from Excel
  const [bulkValidatedAt, setBulkValidatedAt] = useState(null) // When validation was last run
  const [bulkFileName, setBulkFileName] = useState("") // Display name of selected file
  const [bulkFileKey, setBulkFileKey] = useState(0) // Resets file input when clearing
  const [bulkFile, setBulkFile] = useState(null) // Selected file; parsed only on "Validate Records"
  const [bulkTemplateMeta, setBulkTemplateMeta] = useState(null) // Template metadata from API (lastUpdated, updatedBy)

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

  const _timePeriods = [
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
    const fetchTemplateMeta = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/templates/user-bulk/meta`,
          {
            headers: { Authorization: `${token}` },
          },
        )
        setBulkTemplateMeta(response.data)
      } catch (error) {
        console.error("Failed to fetch bulk template meta:", error)
      }
    }
    fetchRoles()
    fetchCountries()
    fetchTemplateMeta()
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

  const validatePassword = (password) => {
    // Industrial strength password validation
    const minLength = 8
    const maxLength = 50
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{8,50}$/
    
    if (!password) {
      return "Password is required"
    }
    
    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long`
    }
    
    if (password.length > maxLength) {
      return `Password must not exceed ${maxLength} characters`
    }
    
    if (!passwordPattern.test(password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&^#)"
    }
    
    return ""
  }

  const handleNumericInput = (e, fieldName) => {
    const value = e.target.value.replace(/\D/g, "") // Remove non-numeric characters
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const clampToMaxChars = (val, maxChars = 100) => {
    const str = val == null ? "" : String(val)
    return str.length > maxChars ? str.slice(0, maxChars) : str
  }

  const sanitizeMoney9_2 = (val) => {
    const raw = val == null ? "" : String(val)
    // keep digits and a single dot
    let cleaned = raw.replace(/[^\d.]/g, "")
    const firstDot = cleaned.indexOf(".")
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "")
    }
    const [intPartRaw, decPartRaw] = cleaned.split(".")
    const intPart = (intPartRaw || "").slice(0, 9)
    const decPart = decPartRaw != null ? decPartRaw.slice(0, 2) : null
    if (decPart === null) return intPart
    return decPart.length > 0 ? `${intPart}.${decPart}` : `${intPart}.`
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
    } else if (name === "password" || name === "confirmPassword") {
      const limitedTextFields = new Set([
        "firstName",
        "middleName",
        "lastName",
        "displayName",
        "password",
        "confirmPassword",
      ])
      const nextValue = limitedTextFields.has(name) ? clampToMaxChars(value, 50) : value
      setFormData((prev) => ({
        ...prev,
        [name]: nextValue,
      }))
      
      // Real-time password validation
      if (name === "password") {
        const validationError = validatePassword(nextValue)
        setPasswordError(validationError)
      }
      
      // Clear password error when passwords match
      if (name === "confirmPassword" && formData.password === value) {
        setPasswordError("")
      }
    } else {
      const limitedTextFields = new Set([
        "firstName",
        "middleName",
        "lastName",
        "displayName",
        "password",
        "confirmPassword",
      ])
      const nextValue =
        name === "cost"
          ? sanitizeMoney9_2(value)
          : limitedTextFields.has(name)
            ? clampToMaxChars(value, 100)
            : value
      setFormData((prev) => ({
        ...prev,
        [name]: nextValue,
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

  /**
   * Validates a single bulk user row (email format, required fields, role, password match).
   * Returns { isValid, errors } for the row.
   */
  const validateBulkUser = (user) => {
    const errors = []

    if (!user.email) {
      errors.push("Email is required")
    } else if (!user.email.includes("@")) {
      errors.push("Email must contain @")
    }

    if (!user.firstName) {
      errors.push("First name is required")
    }

    if (!user.lastName) {
      errors.push("Last name is required")
    }

    if (!user.roleId) {
      if (user.roleName) {
        errors.push(`No role found with name "${user.roleName}"`)
      } else {
        errors.push("Role name is required")
      }
    }

    if (!user.password) {
      errors.push("Password is required")
    }

    if (user.password !== user.confirmPassword) {
      errors.push("Passwords do not match")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /** On file select: store file and name only; clear previous validation. Data is shown only after "Validate Records". */
  const handleBulkFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBulkFileName(file.name)
    setBulkFile(file)
    setBulkUsers([])
    setBulkValidatedAt(null)
  }

  /** Parses the selected Excel file, maps rows to user objects, runs validation, and updates bulkUsers + bulkValidatedAt. */
  const parseAndValidateBulkFile = () => {
    if (!bulkFile) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" })

      const mapped = jsonRows.map((row, index) => {
        const roleNameFromSheet =
          row.roleName ||
          row.RoleName ||
          row.role ||
          row.Role ||
          ""

        const matchedRole = roles.find((r) => r.roleName === roleNameFromSheet)

        const user = {
          email: row.email || row.Email || "",
          firstName: row.firstName || row.FirstName || "",
          middleName: row.middleName || row.MiddleName || "",
          lastName: row.lastName || row.LastName || "",
          displayName: row.displayName || row.DisplayName || "",
          mobileCountryCode: row.mobileCountryCode || formData.mobileCountryCode,
          mobileNumber: row.mobileNumber || "",
          landlineCountryCode: row.landlineCountryCode || formData.landlineCountryCode,
          landlineNumber: row.landlineNumber || "",
          cost: row.cost || "",
          cost_time: row.cost_time || formData.cost_time,
          unit: row.unit || formData.unit,
          addressLine1: row.addressLine1 || "",
          addressLine2: row.addressLine2 || "",
          addressLine3: row.addressLine3 || "",
          country: row.country || "",
          zipCode: row.zipCode || "",
          city: row.city || "",
          state: row.state || "",
          password: row.password || "",
          confirmPassword: row.confirmPassword || row.password || "",
          status: row.status || "active",
          tenant: formData.tenant,
          roleId: matchedRole?.roleId || null,
          _rowIndex: index + 2,
        }

        const validation = validateBulkUser(user)
        return { ...user, ...validation, roleName: roleNameFromSheet }
      })

      // Mark rows with duplicate email in the sheet as invalid
      const emailCount = new Map()
      mapped.forEach((row, idx) => {
        const key = (row.email || "").toString().trim().toLowerCase()
        if (!key) return
        if (!emailCount.has(key)) emailCount.set(key, [])
        emailCount.get(key).push(idx)
      })
      const duplicateEmails = new Set(
        [...emailCount.entries()].filter(([, indices]) => indices.length > 1).map(([email]) => email),
      )
      const withDuplicateCheck = mapped.map((row) => {
        const key = (row.email || "").toString().trim().toLowerCase()
        if (!duplicateEmails.has(key)) return row
        const newErrors = [...(row.errors || []), "Duplicate email in sheet"]
        return { ...row, errors: newErrors, isValid: false }
      })

      setBulkUsers(withDuplicateCheck)
      setBulkValidatedAt(new Date())
    }

    reader.readAsArrayBuffer(bulkFile)
  }

  /** Clears selected file, parsed data, and validation state; resets file input. */
  const clearBulkUpload = () => {
    setBulkFile(null)
    setBulkUsers([])
    setBulkValidatedAt(null)
    setBulkFileName("")
    setBulkFileKey((prev) => prev + 1)
  }

  /** Downloads the bulk user template file from the API (from templates table). */
  const handleDownloadBulkTemplate = async () => {
    try {
      const token = sessionStorage.getItem("token")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/templates/user-bulk/download`,
        {
          responseType: "blob",
          headers: { Authorization: `${token}` },
        },
      )

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      const disposition = response.headers["content-disposition"] || ""
      const match = disposition.match(/filename="(.+)"/)
      const filename = match ? match[1] : bulkTemplateMeta?.templateFileName || "bulk-user-template.xlsx"

      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download bulk template:", error)
      setSnackbar({
        open: true,
        message: "Failed to download template",
        severity: "error",
      })
    }
  }

  /** Triggered by "Validate Records" button: parses and validates the selected Excel file. */
  const handleValidateRecords = () => {
    if (bulkFile) {
      parseAndValidateBulkFile()
    }
  }

  /** Maps a bulk user object to a plain row for Excel export (same columns as template). */
  const bulkUserToExcelRow = (user) => ({
    email: user.email,
    firstName: user.firstName,
    middleName: user.middleName || "",
    lastName: user.lastName,
    displayName: user.displayName || "",
    mobileCountryCode: user.mobileCountryCode || "",
    mobileNumber: user.mobileNumber || "",
    landlineCountryCode: user.landlineCountryCode || "",
    landlineNumber: user.landlineNumber || "",
    cost: user.cost || "",
    cost_time: user.cost_time || "",
    unit: user.unit || "",
    addressLine1: user.addressLine1 || "",
    addressLine2: user.addressLine2 || "",
    addressLine3: user.addressLine3 || "",
    country: user.country || "",
    zipCode: user.zipCode || "",
    city: user.city || "",
    state: user.state || "",
    password: user.password || "",
    confirmPassword: user.confirmPassword || "",
    status: user.status || "active",
    roleName: user.roleName || "",
  })

  /** Exports only valid rows to an Excel file (valid-records.xlsx). */
  const downloadValidRecordsExcel = () => {
    const valid = bulkUsers.filter((u) => u.isValid)
    if (valid.length === 0) return
    const rows = valid.map((u) => bulkUserToExcelRow(u))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Valid Records")
    XLSX.writeFile(wb, "valid-records.xlsx")
  }

  /** Exports only invalid rows to an Excel file with an "Errors" column (invalid-records.xlsx). */
  const downloadInvalidRecordsExcel = () => {
    const invalid = bulkUsers.filter((u) => !u.isValid)
    if (invalid.length === 0) return
    const rows = invalid.map((u) => ({
      ...bulkUserToExcelRow(u),
      Errors: u.errors && u.errors.length ? u.errors.join("; ") : "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Invalid Records")
    XLSX.writeFile(wb, "invalid-records.xlsx")
  }

  /** Submits only valid bulk users to the backend bulk-signup API; redirects to /users on success. */
  const handleBulkSubmit = async () => {
    const validUsers = bulkUsers.filter((u) => u.isValid)

    if (validUsers.length === 0) {
      setSnackbar({
        open: true,
        message: "No valid records to submit.",
        severity: "warning",
      })
      return
    }

    setLoading(true)

    try {
      const payload = validUsers.map((u) => {
        const { isValid: _isValid, errors: _errors, _rowIndex: __rowIndex, ...rest } = u
        return rest
      })
      const token = sessionStorage.getItem("token")

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/bulk-signup`,
        payload,
        {
          headers: token ? { Authorization: token } : {},
        },
      )

      const data = response.data
      const created = data?.created ?? 0
      const failed = data?.failed ?? 0
      let msg
      if (created > 0) {
        msg = `${created} user${created === 1 ? "" : "s"} created successfully.`
        if (failed > 0) msg += ` ${failed} failed.`
      } else {
        msg = data?.message || "No users created."
        if (failed > 0) msg += ` (${failed} failed).`
      }
      if (failed > 0 && data?.rows?.length) {
        const firstError = data.rows.find((r) => r.error)?.error
        if (firstError) msg += ` First error: ${firstError}`
      }
      setSnackbar({
        open: true,
        message: msg,
        severity: created === 0 ? "error" : "success",
      })

      navigate("/users")
    } catch (error) {
      console.error("Bulk signup failed:", error.response?.data || error.message)
      const errMsg = error.response?.data?.message || error.response?.data || error.message || "Bulk signup failed!"
      const rows = error.response?.data?.rows
      const firstError = Array.isArray(rows) && rows.length ? rows.find((r) => r.error)?.error : null
      setSnackbar({
        open: true,
        message: firstError ? `${errMsg} (${firstError})` : errMsg,
        severity: "error",
      })
    } finally {
      setLoading(false)
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

    const passwordValidationError = validatePassword(formData.password)
    if (passwordValidationError) {
      setError(passwordValidationError)
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/users/signup`, submissionData, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 w-full max-w-6xl p-6 my-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold bg-green-600 bg-clip-text text-transparent">
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
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                mode === "single"
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
              }`}
              disabled={loading}
            >
              Create Single User
            </button>
            <button
              type="button"
              onClick={() => setMode("bulk")}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                mode === "bulk"
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
              }`}
              disabled={loading}
            >
              Create Bulk Users
            </button>
          </div>

          {mode === "single" && (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
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
                maxLength={100}
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
                maxLength={100}
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
                maxLength={100}
                required
                disabled={loading}
              />
            </div>
            <div className="w-full">
              <label htmlFor="displayName" className="block text-slate-700 font-medium mb-2 text-sm">
                Display Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="h-5 w-5 text-black group-focus-within:text-green-700" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Display name"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                  value={formData.displayName}
                  onChange={handleChange}
                  maxLength={100}
                  disabled={loading}
                />
              </div>
            </div>
            </div>

            {/* Second Row: Email, Cost, Mobile Phone, Landline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-slate-700 font-medium mb-2 text-sm">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-5 w-5 text-black group-focus-within:text-green-700" />
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
                  <div className="relative flex">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                      <span className="text-green-100 font-medium text-sm">{getCurrentCurrencySymbol()}</span>
                    </div>
                    <input
                      id="cost"
                      name="cost"
                      type="text"
                      placeholder="0.00"
                      className="w-full pl-8 pr-2 py-2.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 bg-transparent"
                      value={formData.cost}
                      onChange={handleChange}
                      inputMode="decimal"
                      pattern="^\\d{0,9}(\\.\\d{0,2})?$"
                      disabled={loading}
                    />
                    <input
                      id="cost_time"
                      name="cost_time"
                      type="text"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300"
                      value="hourly"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Phone */}
              <div>
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
                      <PhoneIcon className="h-4 w-4 text-green-100" />
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
              </div>

              {/* Landline */}
              <div>
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
              </div>
            </div>
            {/* Profile Picture Row */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-2 text-sm">Profile Picture</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                      {photoPreview ? (
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 text-green-100" />
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
                    <MapPinIcon className="h-4 w-4 text-green-100 group-focus-within:text-blue-500 transition-colors" />
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

            </div>
          </div>


          {/* Password Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-slate-700 font-medium mb-3">
                Password <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 ml-2 font-normal">
                  ({formData.password.length}/50)
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 ${
                    passwordError ? "border-red-300" : "border-slate-200"
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                  maxLength={50}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-green-100 hover:text-slate-600 transition-colors"
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
              
              {/* Password Requirements */}
              <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-700 mb-2">Password must contain:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      formData.password.length >= 8 ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {formData.password.length >= 8 && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={formData.password.length >= 8 ? "text-green-700" : "text-slate-600"}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      /[A-Z]/.test(formData.password) ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {/[A-Z]/.test(formData.password) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={/[A-Z]/.test(formData.password) ? "text-green-700" : "text-slate-600"}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      /[a-z]/.test(formData.password) ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {/[a-z]/.test(formData.password) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={/[a-z]/.test(formData.password) ? "text-green-700" : "text-slate-600"}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      /\d/.test(formData.password) ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {/\d/.test(formData.password) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={/\d/.test(formData.password) ? "text-green-700" : "text-slate-600"}>
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      /[@$!%*?&^#]/.test(formData.password) ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {/[@$!%*?&^#]/.test(formData.password) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={/[@$!%*?&^#]/.test(formData.password) ? "text-green-700" : "text-slate-600"}>
                      One special character (@$!%*?&^#)
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Password Error */}
              {passwordError && (
                <div className="mt-2 text-red-600 text-xs flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  {passwordError}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-slate-700 font-medium mb-3">
                Confirm Password <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 ml-2 font-normal">
                  ({formData.confirmPassword.length}/50)
                </span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-300" : "border-slate-200"
                  }`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  maxLength={50}
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className={`mt-2 text-xs flex items-center gap-1 ${
                  formData.password === formData.confirmPassword ? "text-green-600" : "text-red-600"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    formData.password === formData.confirmPassword ? "bg-green-400" : "bg-red-400"
                  }`}></div>
                  {formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
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
          </>
          )}

          {mode === "bulk" && (
            <div className="space-y-6 mt-4">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
                <h2 className="text-sm font-semibold mb-3 text-slate-700">
                  Bulk User Upload (Excel)
                </h2>
                <p className="text-xs text-slate-600 mb-3">
                  Upload an Excel file (.xlsx or .xls) with a header row including at least
                  <span className="font-semibold"> email, firstName, lastName, roleName, password, confirmPassword</span>.
                  Profile photo is not supported for bulk upload.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <button
                    type="button"
                    onClick={handleDownloadBulkTemplate}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
                    disabled={loading}
                  >
                    Download Template
                  </button>
                  {bulkTemplateMeta && (
                    <div className="text-[11px] text-slate-600 text-right">
                      <div>
                        <span className="font-semibold">Last updated:</span>{" "}
                        {bulkTemplateMeta.lastUpdated
                          ? new Date(bulkTemplateMeta.lastUpdated).toLocaleString()
                          : "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Updated by:</span>{" "}
                        {bulkTemplateMeta.updatedBy || "—"}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <input
                    key={bulkFileKey}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkFileChange}
                    disabled={loading}
                    className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {bulkFileName && (
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="truncate max-w-[180px]">Selected: {bulkFileName}</span>
                      <button
                        type="button"
                        onClick={clearBulkUpload}
                        disabled={loading}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Data and validation will appear only after you click &quot;Validate Records&quot;.
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleValidateRecords}
                    disabled={loading || !bulkFile}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Validate Records
                  </button>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <span className="font-semibold">Validation timestamp:</span>{" "}
                      {bulkValidatedAt ? bulkValidatedAt.toLocaleString() : "Not validated yet"}
                    </div>
                    <div>
                      <span className="font-semibold">Valid records:</span>{" "}
                      {bulkUsers.filter((u) => u.isValid).length}
                    </div>
                    <div>
                      <span className="font-semibold">Invalid records:</span>{" "}
                      {bulkUsers.filter((u) => !u.isValid).length}
                    </div>
                  </div>
                </div>
              </div>

              {bulkUsers.length > 0 && (
                <>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={downloadValidRecordsExcel}
                    disabled={bulkUsers.filter((u) => u.isValid).length === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
                  >
                    Download Valid Records (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={downloadInvalidRecordsExcel}
                    disabled={bulkUsers.filter((u) => !u.isValid).length === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
                  >
                    Download Invalid Records (Excel)
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-auto bg-white/70">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">First Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Last Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Email</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Role Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkUsers.map((user, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                          <td className="px-3 py-2 text-slate-700">{index + 1}</td>
                          <td className="px-3 py-2 text-slate-700">{user.firstName}</td>
                          <td className="px-3 py-2 text-slate-700">{user.lastName}</td>
                          <td className="px-3 py-2 text-slate-700">{user.email}</td>
                          <td className="px-3 py-2 text-slate-700">{user.roleName || ""}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                user.isValid
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {user.isValid ? "Valid" : "Invalid"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-red-600 max-w-xs">
                            {user.errors && user.errors.length > 0 ? user.errors.join(", ") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}

              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={loading || bulkUsers.filter((u) => u.isValid).length === 0}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating Bulk Users...
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Submit Bulk Users</span>
                      <div className="ml-2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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