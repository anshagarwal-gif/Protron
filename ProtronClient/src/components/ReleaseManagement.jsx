import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import GlobalSnackbar from './GlobalSnackbar';
import ViewReleaseModal from './ViewReleaseModal';
import { Pencil, Trash2, Eye, Download } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ReleaseManagement({ projectId, open, onClose }) {
  const [releases, setReleases] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingRelease, setViewingRelease] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (open && projectId) {
      fetchReleases();
      fetchProjectName();
    }
  }, [open, projectId]);

  const fetchProjectName = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/name`, {
        method: 'GET',
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
      });
      const name = await res.text();
      setProjectName(name);
    } catch (e) {
      setProjectName('');
    }
  };

  const fetchReleases = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/releases/project/${projectId}`, {
        method: 'GET',
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setReleases(data);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to fetch releases', severity: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const downloadReleaseExcel = () => {
    try {
      const headers = ['#','Release Name','Start Date','End Date','Description','Created On'];
      const rows = (releases || []).map((r, idx) => ([
        idx + 1,
        r.releaseName || '',
        formatDate(r.startDate),
        formatDate(r.endDate),
        r.description || '',
        formatDate(r.createdOn)
      ]));
      const csv = [headers.join(','), ...rows.map(r => r.map(v => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('\n') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `release_list_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to download Excel', severity: 'error' });
    }
  };

  const handleAddRelease = () => {
    setAddModalOpen(true);
  };

  const handleEditRelease = (rowIndex) => {
    setEditingRelease(releases[rowIndex]);
    setEditModalOpen(true);
  };

  const handleViewRelease = (rowIndex) => {
    setViewingRelease(releases[rowIndex]);
    setViewModalOpen(true);
  };

  const handleDeleteRelease = async (rowIndex) => {
    const releaseId = releases[rowIndex].releaseId;
    try {
      await fetch(`${API_BASE_URL}/api/releases/${releaseId}`, { method: 'DELETE', headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        }, });
      setSnackbar({ open: true, message: 'Release deleted', severity: 'success' });
      fetchReleases();
    } catch (e) {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  const handleAddSubmit = async (formData) => {
    try {
      await fetch(`${API_BASE_URL}/api/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...formData, projectId }),
      });
      setSnackbar({ open: true, message: 'Release added', severity: 'success' });
      setAddModalOpen(false);
      fetchReleases();
    } catch (e) {
      setSnackbar({ open: true, message: 'Add failed', severity: 'error' });
    }
  };

  const handleEditSubmit = async (formData) => {
    setSnackbar({ open: true, message: 'Release updated', severity: 'success' });
      setEditModalOpen(false);
      fetchReleases();
  };

  const columnDefs = [
    { headerName: '#', valueGetter: 'node.rowIndex + 1', width: 50 },
    { headerName: 'Release Name', field: 'releaseName', flex: 1 },
    { 
      headerName: 'Start Date', 
      field: 'startDate', 
      width: 140,
      cellRenderer: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    },
    { 
      headerName: 'End Date', 
      field: 'endDate', 
      width: 140,
      cellRenderer: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    },
    { headerName: 'Description', field: 'description', flex: 2 },
    { 
      headerName: 'Created On', 
      field: 'createdOn', 
      width: 140, 
      cellRenderer: (params) => {
        if (!params.value) return '';
        const d = new Date(params.value);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 120,
      cellRenderer: (params) => (
        <div className="flex gap-1">
          <button onClick={() => handleViewRelease(params.node.rowIndex)} className="p-1 rounded hover:bg-gray-100 text-gray-700" title="View">
            <Eye size={16} />
          </button>
          <button onClick={() => handleEditRelease(params.node.rowIndex)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={() => handleDeleteRelease(params.node.rowIndex)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-green-900">Release Management</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">Close</button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-900">Release List</h3>
              <div className="flex items-center gap-2">
                <button onClick={downloadReleaseExcel} className="flex items-center px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800">
                  <Download size={16} className="mr-2" /> Download Excel
                </button>
                <button onClick={handleAddRelease} className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">
                  Add Release
                </button>
              </div>
            </div>
            <div className="h-96 w-full border rounded-md">
              <div className="ag-theme-alpine h-full w-full">
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={releases}
                  defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  suppressRowClickSelection={true}
                  animateRows={true}
                  rowHeight={48}
                  headerHeight={48}
                />
              </div>
            </div>
          </div>
          <GlobalSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          />
          <ReleaseFormModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSubmit={handleAddSubmit}
            initialData={null}
            projectName={projectName}
            projectId={projectId}
          />
          <ReleaseFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSubmit}
            initialData={editingRelease}
            projectName={projectName}
            projectId={projectId}
          />
          <ViewReleaseModal
            open={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            releaseData={viewingRelease}
          />
        </div>
      </div>
    </>
  );
}

function ReleaseFormModal({ open, onClose, onSubmit, initialData, projectName, projectId }) {
  const [formData, setFormData] = useState({
    releaseName: '',
    startDate: '',
    endDate: '',
    description: '',
    projectName: '',
  });
  const [releaseFiles, setReleaseFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        releaseName: initialData.releaseName || '',
        startDate: initialData.startDate ? initialData.startDate.substring(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.substring(0, 10) : '',
        description: initialData.description || '',
        projectName: projectName || '',
      });
      // Fetch existing attachments for edit
      if (initialData.releaseId) {
        fetchAttachments(initialData.releaseId);
      } else {
        setExistingAttachments([]);
      }
    } else {
      setFormData({ releaseName: '', startDate: '', endDate: '', description: '', projectName: projectName || '' });
      setReleaseFiles([]);
      setExistingAttachments([]);
    }
  }, [initialData, open, projectName]);

  const fetchAttachments = async (releaseId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/releases/${releaseId}/attachments`, {
        method: 'GET',
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setExistingAttachments(data);
    } catch (e) {
      setExistingAttachments([]);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    const totalExisting = existingAttachments.length;
    const totalFiles = releaseFiles.length + selectedFiles.length + totalExisting;
    if (totalFiles > 4) {
      alert(`Maximum 4 attachments allowed in total (existing + new). You already have ${totalExisting} existing attachments.`);
      return;
    }
    setReleaseFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    e.target.value = null;
  };

  const removeAttachment = (indexToRemove) => {
    setReleaseFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDeleteExistingAttachment = async (attachmentId) => {
    try {
      await fetch(`${API_BASE_URL}/api/releases/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
      });
      setExistingAttachments((prev) => prev.filter(att => att.id !== attachmentId));
    } catch (e) {
      alert('Failed to delete attachment');
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.releaseName) errs.releaseName = 'Required';
    if (!formData.startDate) errs.startDate = 'Required';
    if (!formData.endDate) errs.endDate = 'Required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) errs.endDate = 'End date must be after start date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Upload files after release is created/edited
  const uploadFiles = async (releaseId) => {
    setUploading(true);
    for (const file of releaseFiles) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`${API_BASE_URL}/api/releases/${releaseId}/attachments`, {
        method: 'POST',
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
        body: formData,
      });
    }
    setUploading(false);
    setReleaseFiles([]);
    fetchAttachments(releaseId);  
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    let releaseId = initialData?.releaseId;
    let isEdit = !!initialData;
    const token = sessionStorage.getItem('token');
    try {
      if (isEdit) {
        // Call edit API and get updated releaseId from response
        const res = await fetch(`${API_BASE_URL}/api/releases/${initialData.releaseId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        releaseId = data.releaseId || data.id;
        // Update project for all existing attachments
        if (existingAttachments.length > 0) {
          const attachmentIds = existingAttachments.map(att => att.id);
          await fetch(`${API_BASE_URL}/api/releases/attachments/update-project/${releaseId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'authorization': token,
            },
            body: JSON.stringify(attachmentIds),
          });
        }
        if (typeof onSubmit === 'function') onSubmit(data);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/releases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
          body: JSON.stringify({ ...formData, projectId }),
        });
        const data = await res.json();
        releaseId = data.releaseId || data.id;
        if (typeof onSubmit === 'function') onSubmit(data);
      }
      // Upload files if any
      if (releaseFiles.length > 0 && releaseId) {
        await uploadFiles(releaseId);
      }
      // Close modal and update table
      if (typeof onClose === 'function') onClose();
      if (typeof window.fetchReleases === 'function') window.fetchReleases();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            {initialData ? 'Edit Release' : 'Add Release'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-gray-400">&#10005;</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700 mb-1">Release Name *</label>
                <input
                  name="releaseName"
                  value={formData.releaseName}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.releaseName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter release name"
                  maxLength={100}
                  required
                />
                {errors.releaseName && <span className="text-red-500 text-xs mt-1 block">{errors.releaseName}</span>}
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  name="projectName"
                  value={formData.projectName}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                  disabled
                  placeholder="Project Name"
                />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  onFocus={e => e.target.showPicker && e.target.showPicker()}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.startDate && <span className="text-red-500 text-xs mt-1 block">{errors.startDate}</span>}
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  onFocus={e => e.target.showPicker && e.target.showPicker()}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.endDate && <span className="text-red-500 text-xs mt-1 block">{errors.endDate}</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                rows={3}
                placeholder="Enter release description..."
                maxLength={500}
              />
              {errors.description && <span className="text-red-500 text-xs mt-1 block">{errors.description}</span>}
            </div>
            {/* Attachments */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Release Attachments (Max 4)</label>
              <div className="relative">
                <input
                  type="file"
                  id="release-attachment-input"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={existingAttachments.length + releaseFiles.length >= 4}
                />
                <label
                  htmlFor="release-attachment-input"
                  className={`w-[300px] h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center cursor-pointer ${existingAttachments.length + releaseFiles.length >= 4 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  style={existingAttachments.length + releaseFiles.length >= 4 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                >
                  <span className="text-gray-500 truncate">
                    {releaseFiles.length > 0 ? `${releaseFiles.length} file(s) selected` : 'Click to select files'}
                  </span>
                </label>
              </div>
              <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
                {releaseFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center bg-gray-100 px-3 py-1 rounded max-w-[150px]"
                  >
                    <span className="truncate max-w-[100px]" title={file.name}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-2 text-red-600 hover:text-red-800 text-xs"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
              {/* Existing Attachments (Edit) */}
              {existingAttachments.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-xs mb-1">Existing Attachments:</div>
                  <ul className="text-sm text-gray-700 flex flex-wrap gap-2">
                    {existingAttachments.map(att => (
                      <li key={att.id} className="flex items-center bg-gray-100 px-3 py-1 rounded max-w-[150px]">
                        <span className="truncate max-w-[100px]" title={att.fileName}>{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingAttachment(att.id)}
                          className="ml-2 text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center"
              disabled={uploading || submitting}
            >
              {submitting ? (
                <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : null}
              {initialData ? 'Update Release' : 'Add Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
