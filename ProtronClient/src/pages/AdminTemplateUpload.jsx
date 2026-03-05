import { useEffect, useState } from "react"
import axios from "axios"

const AdminTemplateUpload = () => {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [severity, setSeverity] = useState("info")

  const fetchMeta = async () => {
    try {
      const token = sessionStorage.getItem("token")
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/templates/user-bulk/meta`,
        { headers: token ? { Authorization: token } : {} },
      )
      setMeta(res.data)
    } catch {
      // no template yet is fine
    }
  }

  useEffect(() => {
    fetchMeta()
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setFileName(f.name)
    setMessage("")
  }

  const handleUpload = async () => {
    if (!file) {
      setSeverity("warning")
      setMessage("Please select an Excel file first.")
      return
    }
    setLoading(true)
    setMessage("")
    try {
      const token = sessionStorage.getItem("token")
      const updatedBy = sessionStorage.getItem("email") || "tenant_admin"
      const formData = new FormData()
      formData.append("file", file)
      formData.append("updatedBy", updatedBy)

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/templates/user-bulk`,
        formData,
        {
          headers: {
            ...(token ? { Authorization: token } : {}),
            "Content-Type": "multipart/form-data",
          },
        },
      )

      setMeta(res.data)
      setSeverity("success")
      setMessage("Template uploaded successfully.")
      setFile(null)
      setFileName("")
    } catch (err) {
      setSeverity("error")
      const data = err.response?.data
      const msg =
        typeof data === "string"
          ? data
          : data?.message || "Failed to upload template."
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 w-full max-w-3xl p-6 my-4">
        <h1 className="text-2xl font-bold bg-green-600 bg-clip-text text-transparent mb-4">
          Bulk User Template Management
        </h1>
        <p className="text-slate-600 text-sm mb-4">
          This page is for administrators to manage the Excel template used in Bulk User creation.
        </p>

        {meta && (
          <div className="mb-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div>
              <span className="font-semibold">Current template file:</span>{" "}
              {meta.templateFileName || "—"}
            </div>
            <div>
              <span className="font-semibold">Last updated:</span>{" "}
              {meta.lastUpdated ? new Date(meta.lastUpdated).toLocaleString() : "—"}
            </div>
            <div>
              <span className="font-semibold">Updated by:</span>{" "}
              {meta.updatedBy || "—"}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 font-medium mb-2 text-sm">
              Upload new template (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {fileName && (
              <p className="mt-1 text-xs text-slate-600">Selected: {fileName}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
          >
            {loading ? "Uploading..." : "Upload Template"}
          </button>

          {message && (
            <div
              className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                severity === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : severity === "warning"
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminTemplateUpload

