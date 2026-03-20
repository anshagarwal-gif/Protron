import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import GlobalSnackbar from './GlobalSnackbar';
import ViewSprintModal from './ViewSprintModal';
import { Pencil, Trash2, Eye, Download, Copy } from 'lucide-react';
import ThreeDotsMenu from './ThreeDotsMenu';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Character count helper function
const getCharacterCount = (value, maxLength) => {
  const currentLength = value ? value.length : 0;
  const isOverLimit = currentLength > maxLength;
  return (
    <div className={`text-right text-xs mt-1 ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
      {currentLength}/{maxLength} characters
    </div>
  );
};

export default function SprintManagement({ projectId, open, onClose }) {
  const [sprints, setSprints] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSprint, setViewingSprint] = useState(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicatingSprint, setDuplicatingSprint] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [projectName, setProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Client-side search filtering (same behavior as Release)
  const filteredSprints = useMemo(() => {
    if (!searchTerm) return sprints;
    const lowerTerm = searchTerm.toLowerCase();
    return sprints.filter((s) =>
      (s.sprintName && s.sprintName.toLowerCase().includes(lowerTerm)) ||
      (s.description && s.description.toLowerCase().includes(lowerTerm))
    );
  }, [sprints, searchTerm]);

  useEffect(() => {
    if (open && projectId) {
      fetchSprints();
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

  const fetchSprints = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sprints/project/${projectId}`, {
        method: 'GET',
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setSprints(data);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to fetch sprints', severity: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = monthNames[d.getMonth()];
    return `${day}-${monthStr}-${year}`;
  };

  const downloadSprintExcel = () => {
    try {
      const headers = ['#', 'Sprint Name', 'Start Date', 'End Date', 'Description', 'Created On'];
      const rows = (sprints || []).map((s, idx) => ([
        idx + 1,
        s.sprintName || '',
        formatDate(s.startDate),
        formatDate(s.endDate),
        s.description || '',
        formatDate(s.createdOn)
      ]));
      const csv = [headers.join(','), ...rows.map(r => r.map(v => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('\n') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `sprint_list_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to download Excel', severity: 'error' });
    }
  };

  const handleAddSprint = () => {
    setAddModalOpen(true);
  };

  const handleEditSprint = (data) => {
    setEditingSprint(data);
    setEditModalOpen(true);
  };

  const handleViewSprint = (data) => {
    setViewingSprint(data);
    setViewModalOpen(true);
  };

  const handleDuplicateSprint = (data) => {
    setDuplicatingSprint(data);
    setDuplicateModalOpen(true);
  };

  const handleDeleteSprint = async (data) => {
    const sprintId = data?.sprintId;
    if (!sprintId) return;
    try {
      await fetch(`${API_BASE_URL}/api/sprints/${sprintId}`, {
        method: 'DELETE', headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
      });
      setSnackbar({ open: true, message: 'Sprint deleted', severity: 'success' });
      fetchSprints();
    } catch (e) {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  const handleAddSubmit = async (formData) => {
    try {
      await fetch(`${API_BASE_URL}/api/sprints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...formData, projectId }),
      });
      setSnackbar({ open: true, message: 'Sprint added', severity: 'success' });
      setAddModalOpen(false);
      fetchSprints();
    } catch (e) {
      setSnackbar({ open: true, message: 'Add failed', severity: 'error' });
    }
  };

  const handleEditSubmit = async (formData) => {
    setSnackbar({ open: true, message: 'Sprint updated', severity: 'success' });
    setEditModalOpen(false);
    fetchSprints();
  };

  const handleDuplicateSubmit = (result) => {
    setDuplicateModalOpen(false);
    setSnackbar({ open: true, message: 'Sprint duplicated!', severity: 'success' });
    fetchSprints();
  };

  const columnDefs = [
    {
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      width: 50,
      headerClass: 'serial-col-header',
      cellClass: 'serial-col-cell',
    },
    { headerName: 'Sprint Name', field: 'sprintName', flex: 1 },
    {
      headerName: 'Start Date',
      field: 'startDate',
      width: 140,
      cellRenderer: (params) => {
        return params.value ? formatDate(params.value) : '';
      }
    },
    {
      headerName: 'End Date',
      field: 'endDate',
      width: 140,
      cellRenderer: (params) => {
        return params.value ? formatDate(params.value) : '';
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
      width: 55,
      cellRenderer: (params) => (
        <ThreeDotsMenu
          items={[
            { label: "View", tone: "info", icon: <Eye size={16} />, onClick: () => handleViewSprint(params.data) },
            { label: "Edit", tone: "info", icon: <Pencil size={16} />, onClick: () => handleEditSprint(params.data) },
            { label: "Delete", tone: "danger", icon: <Trash2 size={16} />, onClick: () => handleDeleteSprint(params.data) },
            { label: "Duplicate", tone: "info", icon: <Copy size={16} />, onClick: () => handleDuplicateSprint(params.data) },
          ]}
        />
      ),
    }
  ];

  // Ensure header tooltip is a string (not a callback) so we show full header text.
  const columnDefsWithHeaderTooltips = columnDefs.map((col) => ({
    ...col,
    headerTooltip: col.headerTooltip ?? col.headerName,
  }));

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000059] bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-green-900">Sprint Management | {projectName}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full cursor-pointer">Close</button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-900">Sprint List</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search sprints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none  focus:ring-2 focus:ring-green-500 focus:outline-none w-full sm:w-64"
                />
                <div className="flex gap-2">
                  <button onClick={downloadSprintExcel} className="flex items-center px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 cursor-pointer whitespace-nowrap">
                    <Download size={16} className="mr-2" /> <span className="hidden sm:inline">Download Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </button>
                  <button onClick={handleAddSprint} className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 cursor-pointer whitespace-nowrap">
                    Add Sprint
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full border rounded-md">
              <div className="ag-theme-alpine w-full sprint-grid">
                <AgGridReact
                  columnDefs={columnDefsWithHeaderTooltips}
                  rowData={filteredSprints}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    tooltipValueGetter: (params) => {
                      const v = params.valueFormatted ?? params.value;
                      return v === null || v === undefined ? '' : String(v);
                    },
                  }}
                  domLayout="autoHeight"
                  suppressRowClickSelection={true}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={10}
                  paginationPageSizeSelector={[5, 10, 20, 50]}
                  enableBrowserTooltips={true}
                  tooltipShowDelay={0}
                  rowHeight={48}
                  headerHeight={48}
                />
                <style>{`
                  .sprint-grid .ag-header-cell:hover {
                    background-color: #047857 !important;
                  }
                  .sprint-grid .ag-row:hover {
                    background-color: #f0fdf4 !important;
                  }
                  .sprint-grid .ag-cell:hover {
                    background-color: #f0fdf4 !important;
                  }
                  .sprint-grid .serial-col-header .ag-header-cell-label {
                    justify-content: center !important;
                  }
                  .sprint-grid .ag-cell.serial-col-cell {
                    text-align: center !important;
                    justify-content: center !important;
                    display: flex !important;
                    align-items: center !important;
                  }
                `}</style>
              </div>
            </div>
          </div>
          <GlobalSnackbar
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          />
          <SprintFormModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSubmit={handleAddSubmit}
            initialData={null}
            existingSprints={sprints}
            projectName={projectName}
            projectId={projectId}
            setSnackbar={setSnackbar}
          />
          <SprintFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSubmit}
            initialData={editingSprint}
            existingSprints={sprints}
            projectName={projectName}
            projectId={projectId}
            setSnackbar={setSnackbar}
          />
          <ViewSprintModal
            open={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            sprintData={viewingSprint}
            projectName={projectName}
          />
          <DuplicateSprintModal
            open={duplicateModalOpen}
            onClose={() => setDuplicateModalOpen(false)}
            onSubmit={handleDuplicateSubmit}
            initialData={duplicatingSprint}
            existingSprints={sprints}
            projectName={projectName}
            projectId={projectId}
            setSnackbar={setSnackbar}
          />
        </div>
      </div>
    </>
  );
}

function SprintFormModal({ open, onClose, onSubmit, initialData, existingSprints, projectName, projectId, setSnackbar }) {
  const [formData, setFormData] = useState({
    sprintName: '',
    startDate: '',
    endDate: '',
    description: '',
    projectName: '',
  });
  const [sprintFiles, setSprintFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const formRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        sprintName: initialData.sprintName || '',
        startDate: initialData.startDate ? initialData.startDate.substring(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.substring(0, 10) : '',
        description: initialData.description || '',
        projectName: projectName || '',
      });
      // Fetch existing attachments for edit
      if (initialData.sprintId) {
        fetchAttachments(initialData.sprintId);
      } else {
        setExistingAttachments([]);
      }
    } else {
      setFormData({ sprintName: '', startDate: '', endDate: '', description: '', projectName: projectName || '' });
      setSprintFiles([]);
      setExistingAttachments([]);
    }
  }, [initialData, open, projectName]);

  const fetchAttachments = async (sprintId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sprints/${sprintId}/attachments`, {
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

    // de-dup by (name + size + lastModified) for new files
    const deduped = selectedFiles.filter(file => {
      return !sprintFiles.some(existingFile => {
        return existingFile.name === file.name &&
               existingFile.size === file.size &&
               existingFile.lastModified === file.lastModified;
      });
    });

    const totalExisting = existingAttachments.length;
    const totalCurrentCount = sprintFiles.length + totalExisting;
    const filesToAdd = deduped.slice(0, 4 - totalCurrentCount);

    if (deduped.length > filesToAdd.length) {
      setSnackbar({
        open: true,
        message: `Only ${filesToAdd.length} more file(s) can be added (max 4). Some duplicate files were skipped.`,
        severity: 'warning'
      });
    }

    if (filesToAdd.length > 0) {
      setSprintFiles((prevFiles) => [...prevFiles, ...filesToAdd]);
    } else if (deduped.length === 0) {
      setSnackbar({
        open: true,
        message: 'All selected files are duplicates and were skipped.',
        severity: 'info'
      });
    }

    e.target.value = null;
  };

  const removeAttachment = (indexToRemove) => {
    setSprintFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDeleteExistingAttachment = async (attachmentId) => {
    try {
      await fetch(`${API_BASE_URL}/api/sprints/attachments/${attachmentId}`, {
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
    const name = (formData.sprintName || '').trim();
    if (!name) errs.sprintName = 'Required';
    if (!formData.startDate) errs.startDate = 'Required';
    if (!formData.endDate) errs.endDate = 'Required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) errs.endDate = 'End date must be after start date';
    if (name) {
      const currentId = initialData?.sprintId ?? null;
      const duplicate = (existingSprints || []).some((s) => {
        if (!s) return false;
        if (currentId != null && s.sprintId === currentId) return false;
        if (String(s.projectId) !== String(projectId)) return false;
        return (s.sprintName || '').trim().toLowerCase() === name.toLowerCase();
      });
      if (duplicate) errs.sprintName = 'Sprint name already exists in this project';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Upload files after sprint is created/edited
  const uploadFiles = async (sprintId) => {
    setUploading(true);
    for (const file of sprintFiles) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`${API_BASE_URL}/api/sprints/${sprintId}/attachments`, {
        method: 'POST',
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
        body: formData,
      });
    }
    setUploading(false);
    setSprintFiles([]);
    fetchAttachments(sprintId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    let sprintId = initialData?.sprintId;
    let isEdit = !!initialData;
    const token = sessionStorage.getItem('token');
    try {
      if (isEdit) {
        // Call edit API and get updated sprintId from response
        const res = await fetch(`${API_BASE_URL}/api/sprints/${initialData.sprintId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        sprintId = data.sprintId || data.id;
        // Update project for all existing attachments
        if (existingAttachments.length > 0) {
          const attachmentIds = existingAttachments.map(att => att.id);
          await fetch(`${API_BASE_URL}/api/sprints/attachments/update-project/${sprintId}`, {
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
        const res = await fetch(`${API_BASE_URL}/api/sprints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
          body: JSON.stringify({ ...formData, projectId }),
        });
        const data = await res.json();
        sprintId = data.sprintId || data.id;
        if (typeof onSubmit === 'function') onSubmit(data);
      }
      // Upload files if any
      if (sprintFiles.length > 0 && sprintId) {
        await uploadFiles(sprintId);
      }
      // Close modal and update table
      if (typeof onClose === 'function') onClose();
      if (typeof window.fetchSprints === 'function') window.fetchSprints();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center mb-2 sm:mb-0">
            {initialData ? 'Edit Sprint' : 'Add Sprint'} | <span className="break-words overflow-wrap-anywhere">{projectName}</span>
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading || submitting}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={uploading || submitting}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : null}
              {initialData ? 'Update Sprint' : 'Add Sprint'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              disabled={uploading || submitting}
            >
              <span className="text-gray-400">&#10005;</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sprint Name *</label>
                <input
                  name="sprintName"
                  value={formData.sprintName}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.sprintName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter sprint name"
                  maxLength={100}
                  required
                />
                {errors.sprintName && <span className="text-red-500 text-xs mt-1 block">{errors.sprintName}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
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
              <div>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Sprint Goal</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                rows={3}
                placeholder="Enter sprint description..."
                maxLength={500}
              />
              {getCharacterCount(formData.description, 500)}
              {errors.description && <span className="text-red-500 text-xs mt-1 block">{errors.description}</span>}
            </div>
            {/* Attachments */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Sprint Attachments (Max 4), Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, TXT</label>
              <div className="relative">
                <input
                  type="file"
                  id="sprint-attachment-input"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={existingAttachments.length + sprintFiles.length >= 4}
                />
                <label
                  htmlFor="sprint-attachment-input"
                  className={`w-[300px] h-10 pl-10 pr-4 border border-gray-300 rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 flex items-center cursor-pointer ${existingAttachments.length + sprintFiles.length >= 4 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  style={existingAttachments.length + sprintFiles.length >= 4 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                >
                  <span className="text-gray-500 truncate">
                    {sprintFiles.length > 0 ? `${sprintFiles.length} file(s) selected` : 'Click to select files'}
                  </span>
                </label>
              </div>
              <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
                {sprintFiles.map((file, index) => (
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
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-gray-200 p-4 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center cursor-pointer order-1 sm:order-2"
              disabled={uploading || submitting}
            >
              {submitting ? (
                <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : null}
              {initialData ? 'Update Sprint' : 'Add Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DuplicateSprintModal({ open, onClose, onSubmit, initialData, existingSprints, projectName, projectId, setSnackbar }) {
  const [formData, setFormData] = useState({
    sprintName: '',
    startDate: '',
    endDate: '',
    description: '',
    projectName: '',
  });
  const [sprintFiles, setSprintFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        sprintName: initialData.sprintName || '',
        startDate: initialData.startDate ? initialData.startDate.substring(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.substring(0, 10) : '',
        description: initialData.description || '',
        projectName: projectName || '',
      });
      if (initialData.sprintId) {
        fetchAttachments(initialData.sprintId);
      } else {
        setExistingAttachments([]);
      }
    } else {
      setFormData({ sprintName: '', startDate: '', endDate: '', description: '', projectName: projectName || '' });
      setExistingAttachments([]);
    }
    setSprintFiles([]);
    setErrors({});
  }, [initialData, open, projectName]);

  const fetchAttachments = async (sprintId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sprints/${sprintId}/attachments`, {
        headers: {
          'authorization': `${sessionStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setExistingAttachments(data);
      } else {
        setExistingAttachments([]);
      }
    } catch (e) {
      setExistingAttachments([]);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // de-dup by (name + size + lastModified) for new files
    const deduped = selectedFiles.filter(file => {
      return !sprintFiles.some(existingFile => {
        return existingFile.name === file.name &&
               existingFile.size === file.size &&
               existingFile.lastModified === file.lastModified;
      });
    });

    const totalExisting = existingAttachments.length || 0;
    const totalCurrentCount = sprintFiles.length + totalExisting;
    const filesToAdd = deduped.slice(0, 4 - totalCurrentCount);

    if (deduped.length > filesToAdd.length) {
      setSnackbar({
        open: true,
        message: `Only ${filesToAdd.length} more file(s) can be added (max 4). Some duplicate files were skipped.`,
        severity: 'warning'
      });
    }

    if (filesToAdd.length > 0) {
      setSprintFiles((prevFiles) => [...prevFiles, ...filesToAdd]);
    } else if (deduped.length === 0) {
      setSnackbar({
        open: true,
        message: 'All selected files are duplicates and were skipped.',
        severity: 'info'
      });
    }

    e.target.value = null;
  };

  const removeAttachment = (indexToRemove) => {
    setSprintFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDeleteExistingAttachment = (attachmentId) => {
    // For duplicate modal, we only remove from the list of "to be copied" attachments
    // We do NOT delete from the server, as that would delete from the source sprint.
    setExistingAttachments((prev) => prev.filter(att => att.id !== attachmentId));
  };

  const validate = () => {
    const errs = {};
    const name = (formData.sprintName || '').trim();
    if (!name) errs.sprintName = 'Required';
    if (!formData.startDate) errs.startDate = 'Required';
    if (!formData.endDate) errs.endDate = 'Required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) errs.endDate = 'End date must be after start date';
    if (name) {
      const duplicate = (existingSprints || []).some((s) => {
        if (!s) return false;
        if (String(s.projectId) !== String(projectId)) return false;
        return (s.sprintName || '').trim().toLowerCase() === name.toLowerCase();
      });
      if (duplicate) errs.sprintName = 'Sprint name already exists in this project';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadFiles = async (sprintId) => {
    if (sprintFiles.length === 0) return;
    setUploading(true);
    const token = sessionStorage.getItem('token');
    for (const file of sprintFiles) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        await fetch(`${API_BASE_URL}/api/sprints/${sprintId}/attachments`, {
          method: 'POST',
          headers: {
            'authorization': `${sessionStorage.getItem('token')}`,
          },
          body: fd,
        });
      } catch (err) {
        console.error('Error uploading duplicate file:', err);
      }
    }
    setUploading(false);
    setSprintFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const token = sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/sprints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
        body: JSON.stringify({ ...formData, projectId }),
      });
      const data = await res.json();
      const sprintId = data.sprintId || data.id;

      // 1. Upload new files
      await uploadFiles(sprintId);

      // 2. Copy existing attachments (if any remaining)
      if (existingAttachments.length > 0) {
        const sourceAttachmentIds = existingAttachments.map(att => att.id);
        await fetch(`${API_BASE_URL}/api/sprints/${sprintId}/attachments/copy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
          body: JSON.stringify(sourceAttachmentIds),
        });
      }

      if (typeof onSubmit === 'function') onSubmit(data);
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      console.error('Error duplicating Sprint:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center mb-2 sm:mb-0">
            Duplicate Sprint | <span className="break-words overflow-wrap-anywhere">{projectName}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <span className="text-gray-400">&#10005;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sprint Name *</label>
                <input
                  name="sprintName"
                  value={formData.sprintName}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.sprintName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter sprint name"
                  maxLength={100}
                  required
                />
                {errors.sprintName && <span className="text-red-500 text-xs mt-1 block">{errors.sprintName}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
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
              <div>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Sprint Goal</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                rows={3}
                placeholder="Enter sprint description..."
                maxLength={500}
              />
              {getCharacterCount(formData.description, 500)}
              {errors.description && <span className="text-red-500 text-xs mt-1 block">{errors.description}</span>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Sprint Attachments (Max 4), Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, TXT</label>
              <div className="relative">
                <input
                  type="file"
                  id="duplicate-sprint-attachment-input"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={(existingAttachments.length + sprintFiles.length) >= 4}
                />
                <label
                  htmlFor="duplicate-sprint-attachment-input"
                  className={`w-[300px] h-10 pl-10 pr-4 border border-gray-300 rounded-md  focus:ring-2 focus:ring-green-500 focus:outline-none focus:border-green-500 flex items-center cursor-pointer ${sprintFiles.length >= 4 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  style={(existingAttachments.length + sprintFiles.length) >= 4 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                >
                  <span className="text-gray-500 truncate">
                    {sprintFiles.length > 0 ? `${sprintFiles.length} file(s) selected` : 'Click to select files'}
                  </span>
                </label>
              </div>
              <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
                {sprintFiles.map((file, index) => (
                  <li key={index} className="flex items-center bg-gray-100 px-3 py-1 rounded max-w-[150px]">
                    <span className="truncate max-w-[100px]" title={file.name}>{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(index)} className="ml-2 text-red-600 hover:text-red-800 text-xs">Delete</button>
                  </li>
                ))}
              </ul>
              {/* Existing Attachments (Source) */}
              {existingAttachments.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-xs mb-1">Source Sprint Attachments:</div>
                  <ul className="text-sm text-gray-700 flex flex-wrap gap-2">
                    {existingAttachments.map(att => (
                      <li key={att.id} className="flex items-center bg-gray-100 px-3 py-1 rounded max-w-[150px]">
                        <span className="truncate max-w-[100px]" title={att.fileName}>{att.fileName}</span>
                        <button type="button" onClick={() => handleDeleteExistingAttachment(att.id)} className="ml-2 text-red-600 hover:text-red-800 text-xs">Delete</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-gray-200 p-4 sm:p-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer order-2 sm:order-1">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center cursor-pointer order-1 sm:order-2" disabled={uploading || submitting}>
              {submitting ? (
                <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : null}
              Add Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
