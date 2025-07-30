import { useState, useEffect } from "react";
import { UserIcon, PhoneIcon, MapPinIcon, UploadIcon, Loader2 } from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "./GlobalSnackbar";

const UserEditForm = ({ userId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    mobileCountryCode: "+91",
    mobileNumber: "",
    cost: "",
    cost_time: "hour",
    unit: "USD",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    country: "",
    state: "",
    city: "",
    zipCode: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false,
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [countriesno, setCountriesno] = useState([]);

  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
  };

  const timePeriods = [
    { value: "hour", label: "Hourly" },
    { value: "day", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "month", label: "Monthly" },
    { value: "year", label: "Yearly" },
  ];

  const getCurrentCurrencySymbol = () => {
    return currencySymbols[formData.unit] || "$";
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${userId}/editable-details`,
          {
            headers: { Authorization: `${sessionStorage.getItem("token")}` },
          }
        );
        const data = response.data;
        setFormData({
          firstName: data.firstName || "",
          middleName: data.middleName || "",
          lastName: data.lastName || "",
          mobileCountryCode: data.mobileCountryCode || "+91",
          mobileNumber: data.mobileNumber || "",
          cost: data.cost || "",
          cost_time: data.cost_time || "hour",
          unit: data.unit || "USD",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          addressLine3: data.addressLine3 || "",
          country: data.country || "",
          state: data.state || "",
          city: data.city || "",
          zipCode: data.zipCode || "",
        });
        setPhotoPreview(data.photo || null);
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch user details. Please try again.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
    fetchCountries();
  }, [userId]);

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

  const fetchCountries = async () => {
    setLocationLoading((prev) => ({ ...prev, countries: true }));
    try {
      const response = await axios.get(`https://secure.geonames.org/countryInfoJSON?&username=bhagirathauti`);
      const countriesData = response.data.geonames.map(country => ({
        code: country.countryCode,
        name: country.countryName,
        geonameId: country.geonameId
      })).sort((a, b) => a.name.localeCompare(b.name))

      setCountries(countriesData);
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    } finally {
      setLocationLoading((prev) => ({ ...prev, countries: false }));
    }
  };

  const fetchStates = async (countryCode) => {
    const country = countries.find(c => c.code === countryCode)
    setLocationLoading((prev) => ({ ...prev, states: true }));
    try {
      const response = await axios.get(
        `https://secure.geonames.org/childrenJSON?geonameId=${country.geonameId}&username=bhagirathauti`
      );
      const statesData = response.data?.geonames?.map((state) => ({
        code: state.adminCode1,
        name: state.name,
        geonameId: state.geonameId
      }));
      setStates(statesData);
    } catch (error) {
      console.error("Failed to fetch states:", error);
    } finally {
      setLocationLoading((prev) => ({ ...prev, states: false }));
    }
  };

  const fetchCities = async (stateCode) => {
    const country = countries.find(c => c.code === formData.country);
    const state_Code = states.find(s => s.name === stateCode)?.code;
    setLocationLoading((prev) => ({ ...prev, cities: true }));
    try {
      const response = await axios.get(
        `https://secure.geonames.org/searchJSON?country=${country.code}&adminCode1=${state_Code}&featureClass=P&maxRows=1000&username=bhagirathauti`
      );
      const citiesData = response.data?.geonames?.map((city) => ({
        name: city.name,
        geonameId: city.geonameId,
        postalCodes: city.postalCodes || []
      }));
      setCities(citiesData);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    } finally {
      setLocationLoading((prev) => ({ ...prev, cities: false }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
console.log(name, value);
    if (name === "country") {
      fetchStates(value);
      setCities([]);
    } else if (name === "state") {
      fetchCities(value);
      
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const submissionData = new FormData();

  // Combine country code and number before appending
  const combinedPhone = `${formData.mobileCountryCode}${formData.mobileNumber}`;

  submissionData.append("firstName", formData.firstName);
  submissionData.append("middleName", formData.middleName);
  submissionData.append("lastName", formData.lastName);
  submissionData.append("mobilePhone", combinedPhone); // ✅ Combined phone here
  submissionData.append("addressLine1", formData.addressLine1);
  submissionData.append("addressLine2", formData.addressLine2);
  submissionData.append("addressLine3", formData.addressLine3);
  submissionData.append("city", formData.city);
  submissionData.append("state", formData.state);
  submissionData.append("zipCode", formData.zipCode);
  submissionData.append("country", formData.country);
  submissionData.append("cost", formData.cost);
  submissionData.append("costTime", formData.cost_time); // ✅ map to DTO key
  submissionData.append("unit", formData.unit);

  if (photo) {
    submissionData.append("photo", photo); // will be handled as byte[] by backend
  }

  try {
    await onSubmit(submissionData);
    setSnackbar({
      open: true,
      message: "User information updated successfully!",
      severity: "success",
    });
  } catch (error) {
    console.error("Failed to update user information:", error);
    setSnackbar({
      open: true,
      message: "Failed to update user information. Please try again.",
      severity: "error",
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Edit User Information</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  id="middleName"
                  name="middleName"
                  type="text"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                />
              </div>
            </div>

            {/* Cost Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Currency Unit
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Cost
                </label>
                <input
                  id="cost"
                  name="cost"
                  type="number"
                  value={formData.cost}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="cost_time" className="block text-sm font-medium text-gray-700">
                  Cost Time
                </label>
                <select
                  id="cost_time"
                  name="cost_time"
                  value={formData.cost_time}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                >
                  {timePeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                Mobile Phone
              </label>
              <div className="flex">
                <select
                  id="mobileCountryCode"
                  name="mobileCountryCode"
                  value={formData.mobileCountryCode}
                  onChange={handleChange}
                  className="border-gray-300 rounded-l-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                >
                  {countriesno.map((country, index) => (
                    <option key={index} value={country.dialCode}>
                      {country.dialCode}
                    </option>
                  ))}
                </select>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="flex-1 border-gray-300 rounded-r-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                />
              </div>
            </div>

            {/* Address Section */}
            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                value={formData.addressLine1}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                Address Line 2
              </label>
              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                value={formData.addressLine2}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="addressLine3" className="block text-sm font-medium text-gray-700">
                Address Line 3
              </label>
              <input
                id="addressLine3"
                name="addressLine3"
                type="text"
                value={formData.addressLine3}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
              />
            </div>

            {/* Country, State, City, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                >
                  <option value="">Select State</option>
                  {states?.map((state) => (
                    <option key={state.code} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                >
                  <option value="">Select City</option>
                  {cities?.map((city) => (
                    <option key={city.geonameId} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                />
              </div>
            </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>

      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
        </div>
      </div>
    </div>
  );
};

export default UserEditForm;