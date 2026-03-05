"use client"

import { useState, useEffect } from "react"
import { UploadIcon, Loader2, Download } from "lucide-react"
import axios from "axios"

/**
 * Reusable UI to download the bulk user template and to upload/replace it in the database.
 * Drop this component wherever you need template management; remove the component to remove the whole block.
 *
 * Props (all optional):
 *   - onSuccess?: () => void     Called after a successful upload
 *   - onError?: (message: string) => void
 *   - disabled?: boolean
 *   - updatedBy?: string         Defaults to sessionStorage.getItem('userName') || 'admin'
 *   - showDownload?: boolean     Default true
 *   - showUpload?: boolean       Default true
 *   - showMeta?: boolean        Default true (last updated / updated by)
 *   - className?: string        Wrapper div class
 */
const BulkUserTemplateUpload = ({
  onSuccess,
  onError,
  disabled = false,
  updatedBy: updatedByProp,
  showDownload = true,
  showUpload = true,
  showMeta = true,
  className = "",
}) => {
  const [meta, setMeta] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadError, setUploadError] = useState("")
  const [fileInputKey, setFileInputKey] = useState(0)

  const baseUrl = import.meta.env.VITE_API_URL
  const token = sessionStorage.getItem("token")
  const updatedBy = updatedByProp ?? sessionStorage.getItem("userName") ?? "admin"

  const fetchMeta = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/templates/user-bulk/meta`, {
        headers: { Authorization: token },
      })
      setMeta(response.data)
    } catch (err) {
      console.error("Failed to fetch template meta:", err)
      setMeta(null)
    }
  }

  useEffect(() => {
    fetchMeta()
  }, [])

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/templates/user-bulk/download`, {
        responseType: "blob",
        headers: { Authorization: token },
      })
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      const disposition = response.headers["content-disposition"] || ""
      const match = disposition.match(/filename="?(.+?)"?\s*$/)
      const filename = match ? match[1].trim() : meta?.templateFileName || "bulk-user-template.xlsx"
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to download template:", err)
      onError?.("Failed to download template")
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setSelectedFile(file || null)
    setUploadError("")
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file first.")
      return
    }
    setUploadLoading(true)
    setUploadError("")
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("updatedBy", updatedBy)
      await axios.post(`${baseUrl}/api/templates/user-bulk`, formData, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      })
      setSelectedFile(null)
      setFileInputKey((k) => k + 1)
      await fetchMeta()
      onSuccess?.()
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Upload failed"
      setUploadError(message)
      onError?.(message)
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Bulk user template</h3>

      {showDownload && (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download template
          </button>
        </div>
      )}

      {showMeta && meta && (
        <div className="text-[11px] text-slate-600 mb-3 space-y-0.5">
          <div><span className="font-semibold">Last updated:</span> {meta.lastUpdated ? new Date(meta.lastUpdated).toLocaleString() : "—"}</div>
          <div><span className="font-semibold">Updated by:</span> {meta.updatedBy || "—"}</div>
        </div>
      )}

      {showUpload && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              key={fileInputKey}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={disabled || uploadLoading}
              data-bulk-template
              className="block text-sm text-slate-700 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={disabled || uploadLoading || !selectedFile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
              {uploadLoading ? "Uploading…" : "Upload / Replace template"}
            </button>
          </div>
          {selectedFile && <span className="text-xs text-slate-500">Selected: {selectedFile.name}</span>}
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </div>
      )}
    </div>
  )
}

export default BulkUserTemplateUpload
