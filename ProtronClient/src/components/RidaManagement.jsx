import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, FileText, X, Tag, Calendar, User, UserCheck, CheckCircle, Folder, MessageSquare, Pencil, Trash, Eye, Download } from 'lucide-react';
import axios from 'axios';
import ViewRidaModal from './ViewRidaModal';
import GlobalSnackbar from './GlobalSnackbar';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { AgGridReact } from 'ag-grid-react';

// Dropdown options (example)
const typeOptions = [
  { value: 'R', label: 'Risk' },
  { value: 'I', label: 'Issue' },
  { value: 'D', label: 'Decision' },
  { value: 'A', label: 'Action' }
];
const statusOptions = [
  { value: 'Open', label: 'Open' },
  { value: 'WIP', label: 'WIP' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Hold', label: 'Hold' },
  { value: 'YTS', label: 'YTS' },
  { value: 'De-prioritised', label: 'De-prioritised' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function RidaManagement({ projectId, open, onClose }) {
  const [ridas, setRidas] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRida, setEditingRida] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingRida, setViewingRida] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [projectName, setProjectName] = useState('');
  

  useEffect(() => {
    if (open && projectId) {
      fetchRidas();
      fetchProjectName();
    }
  }, [open, projectId]);

  const fetchProjectName = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/projects/${projectId}/name`, {
        headers: { Authorization: sessionStorage.getItem('token') }
      });
      setProjectName(res.data);
    } catch (e) {
      setProjectName('');
    }
  };

  const fetchRidas = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/rida/project/${projectId}`, {
        headers: { Authorization: token }
      });
      setRidas(res.data || []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch RIDA', severity: 'error' });
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

  const downloadRidaExcel = () => {
    try {
      const headers = [
        '#','Type','Meeting Ref','Description','Raised By','Owner','Status','Remarks'
      ];
      const rows = (ridas || []).map((rida, idx) => ([
        idx + 1,
        rida.type || '',
        rida.meetingReference || '',
        rida.itemDescription || '',
        rida.raisedBy || '',
        rida.owner || '',
        rida.status || '',
        rida.remarks || ''
      ]));
      const csv = [headers.join(','), ...rows.map(r => r.map(v => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('\n') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `rida_list_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to download Excel', severity: 'error' });
    }
  };

  const handleAddRida = () => {
    setEditingRida(null);
    setAddModalOpen(true);
  };

  const handleEditRida = (rowIndex) => {
    setEditingRida(ridas[rowIndex]);
    setEditModalOpen(true);
  };

  const handleViewRida = (rowIndex) => {
    setViewingRida(ridas[rowIndex]);
    setViewModalOpen(true);
  };

  const handleDeleteRida = async (rowIndex) => {
    const rida = ridas[rowIndex];
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/rida/${rida.id}`, {
        headers: { Authorization: token }
      });
      setSnackbar({ open: true, message: 'RIDA deleted!', severity: 'success' });
      fetchRidas();
    } catch (err) {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  const handleAddSubmit = (result) => {
    setAddModalOpen(false);
    setSnackbar({ open: true, message: 'RIDA added!', severity: 'success' });
    fetchRidas();
  };

  const handleEditSubmit = (result) => {
    setEditModalOpen(false);
    setSnackbar({ open: true, message: 'RIDA updated!', severity: 'success' });
    fetchRidas();
  };

  const columnDefs = [
    { headerName: '#', valueGetter: 'node.rowIndex + 1', width: 50 },
    { headerName: 'Type', field: 'type', width: 100 },
    { headerName: 'Meeting Ref', field: 'meetingReference', flex: 1 },
    { headerName: 'Date Raised', field: 'dateRaised', width: 120, valueFormatter: params => formatDate(params.value) },
    { headerName: 'Target Closer', field: 'targetCloser', width: 120, valueFormatter: params => formatDate(params.value) },
    { headerName: 'Description', field: 'itemDescription', flex: 2 },
    { headerName: 'Raised By', field: 'raisedBy', width: 120 },
    { headerName: 'Owner', field: 'owner', width: 120 },
    { headerName: 'Status', field: 'status', width: 120 },
    { headerName: 'Remarks', field: 'remarks', flex: 1 },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 120,
      cellRenderer: (params) => (
        <div className="flex gap-1">
          <button onClick={() => handleViewRida(params.node.rowIndex)} className="p-1 rounded hover:bg-gray-100 text-gray-700" title="View">
            <Eye size={16} />
          </button>
          <button onClick={() => handleEditRida(params.node.rowIndex)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={() => handleDeleteRida(params.node.rowIndex)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Delete">
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
            <h2 className="text-xl font-semibold text-green-900">RIDA Management</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">Close</button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-900">RIDA List</h3>
              <div className="flex items-center gap-2">
                <button onClick={downloadRidaExcel} className="flex items-center px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800">
                  <Download size={16} className="mr-2" /> Download Excel
                </button>
                <button onClick={handleAddRida} className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">
                  <Plus size={16} className="mr-2" /> Add RIDA
                </button>
              </div>
            </div>
            <div className="h-96 w-full border rounded-md">
              <div className="ag-theme-alpine h-full w-full">
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={ridas}
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
          <RidaFormModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSubmit={handleAddSubmit}
            initialData={null}
            projectName={projectName}
            projectId={projectId}
          />
          <RidaFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSubmit}
            initialData={editingRida}
            projectName={projectName}
            projectId={projectId}
          />
          <ViewRidaModal
            open={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            ridaData={viewingRida}
          />
        </div>
      </div>
    </>
  );
}

// Modal for Add/Edit RIDA
function RidaFormModal({ open, onClose, onSubmit, initialData, projectName, projectId }) {
  const [formData, setFormData] = useState({
    meetingReference: '',
    itemDescription: '',
    type: '',
    raisedBy: '',
    owner: '',
    status: '',
    remarks: '',
    projectName: '',
    dateRaised: '',
    targetCloser: '',
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [ridaFiles, setRidaFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/project-team/list/${projectId}`, {
          headers: { Authorization: token }
        });
        const members = res.data || [];
        setTeamMembers(members.map(m => ({ value: m.name, label: m.name })));
      } catch (error) {
        console.error('Error fetching team members:', error);
        setTeamMembers([]);
      }
    };
    fetchTeamMembers();
  }, [projectId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        projectName: projectName || '',
        dateRaised: initialData.dateRaised || '',
        targetCloser: initialData.targetCloser || '',
      });
      if (initialData.id) {
        fetchAttachments(initialData.id);
      } else {
        setExistingAttachments([]);
      }
    } else {
      setFormData({
        meetingReference: '',
        itemDescription: '',
        type: '',
        raisedBy: '',
        owner: '',
        status: '',
        remarks: '',
        projectName: projectName || '',
        dateRaised: '',
        targetCloser: '',
      });
      setExistingAttachments([]);
    }
    setRidaFiles([]);
    setErrors({});
  }, [initialData, open, projectName]);

  const fetchAttachments = async (ridaId) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/rida/${ridaId}/attachments`, {
        headers: { Authorization: token }
      });
      if (res.ok) {
        const data = await res.json();
        setExistingAttachments(data);
      } else {
        setExistingAttachments([]);
      }
    } catch (err) {
      setExistingAttachments([]);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const total = existingAttachments.length + ridaFiles.length + files.length;
    if (total > 4) {
      alert('You can only add up to 4 attachments in total.');
      return;
    }
    setRidaFiles((prev) => [...prev, ...files]);
  };

  const removeAttachment = (indexToRemove) => {
    setRidaFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDeleteExistingAttachment = async (attachmentId) => {
    if (!initialData?.id) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/rida/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: token }
      });
      if (res.ok) {
        setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      }
    } catch (err) {}
  };

  const validate = () => {
    const errs = {};
    if (!formData.meetingReference) errs.meetingReference = 'Required';
    if (!formData.itemDescription) errs.itemDescription = 'Required';
    if (!formData.type) errs.type = 'Required';
    if (!formData.raisedBy) errs.raisedBy = 'Required';
    if (!formData.owner) errs.owner = 'Required';
    if (!formData.status) errs.status = 'Required';
    return errs;
  };

  // Upload files after RIDA is created/edited
  const uploadFiles = async (ridaId) => {
    if (ridaFiles.length === 0) return;
    setUploading(true);
    const token = sessionStorage.getItem('token');
    for (const file of ridaFiles) {
      const fd = new FormData();
      fd.append('file', file);
      await fetch(`${API_BASE_URL}/api/rida/${ridaId}/attachments`, {
        method: 'POST',
        headers: { Authorization: token },
        body: fd,
      });
    }
    setUploading(false);
    fetchAttachments(ridaId);
    setRidaFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const token = sessionStorage.getItem('token');
    let result;
    let ridaId;
    try {
      if (initialData?.id) {
        // Edit RIDA
        const res = await fetch(`${API_BASE_URL}/api/rida/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify(formData),
        });
        result = await res.json();
        ridaId = result.id;
        // Update project for all existing attachments
        if (existingAttachments.length > 0) {
          const attachmentIds = existingAttachments.map(att => att.id);
          await fetch(`${API_BASE_URL}/api/rida/attachments/update-project/${ridaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: token },
            body: JSON.stringify(attachmentIds),
          });
        }
      } else {
        // Add RIDA
        const res = await fetch(`${API_BASE_URL}/api/rida/project/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify(formData),
        });
        result = await res.json();
        ridaId = result.id;
      }
      // Upload new files
      await uploadFiles(ridaId);
      if (typeof onSubmit === 'function') onSubmit(result);
      if (typeof onClose === 'function') onClose();
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
          <FileText size={20} className="mr-2 text-green-600" />
          {initialData ? 'Edit RIDA' : 'Add RIDA'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-4">
          {/* Row 1: Type, Meeting Reference, Date Raised, Target Closer */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Tag size={14} className="inline mr-1" />
                Type *
              </label>
              <Select
                options={typeOptions}
                value={typeOptions.find(opt => opt.value === formData.type) || null}
                onChange={opt => setFormData(f => ({ ...f, type: opt ? opt.value : '' }))}
                isClearable
                placeholder="Select type"
                className="text-sm"
                styles={{ control: (base) => ({ ...base, borderColor: errors.type ? 'red' : base.borderColor }) }}
              />
              {errors.type && <span className="text-red-500 text-xs mt-1 block">{errors.type}</span>}
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Meeting Reference
                <span className="float-right text-xs text-gray-500">
                  {formData.meetingReference.length}/100
                </span>
              </label>
                <input
                  type="text"
                  value={formData.meetingReference}
                  onChange={e => {
                    let value = e.target.value;
                    if (value.length > 100) value = value.slice(0, 100);
                    setFormData(f => ({ ...f, meetingReference: value }));
                  }}
                  maxLength={100}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${errors.meetingReference ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter meeting reference"
                />
              {errors.meetingReference && <span className="text-red-500 text-xs mt-1 block">{errors.meetingReference}</span>}
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date Raised
              </label>
              <input
                type="date"
                value={formData.dateRaised}
                onChange={e => setFormData(f => ({ ...f, dateRaised: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 border-gray-300"
                placeholder="Select date raised"
                onClick={e => e.target.showPicker && e.target.showPicker()}
              />
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Target Closer
              </label>
              <input
                type="date"
                value={formData.targetCloser}
                onChange={e => setFormData(f => ({ ...f, targetCloser: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 border-gray-300"
                placeholder="Select target closer date"
                onClick={e => e.target.showPicker && e.target.showPicker()}
              />
            </div>
          </div>

          {/* Row 2: Item Description (large box) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <FileText size={14} className="inline mr-1" />
              Item Description *
              <span className="float-right text-xs text-gray-500">
                {formData.itemDescription.length}/500 characters
              </span>
            </label>
            <textarea
              value={formData.itemDescription}
              onChange={e => setFormData(f => ({ ...f, itemDescription: e.target.value }))}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none ${errors.itemDescription ? 'border-red-500' : 'border-gray-300'}`}
              rows={4}
              placeholder="Enter detailed item description..."
              maxLength={500}
              required
            />
            {errors.itemDescription && <span className="text-red-500 text-xs mt-1 block">{errors.itemDescription}</span>}
          </div>

          {/* Row 3: Raised By and Owner */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                Raised By
                <span className="float-right text-xs text-gray-500">
                  {formData.raisedBy.length}/100 characters
                </span>
              </label>
              <CreatableSelect
                options={teamMembers}
                value={formData.raisedBy ? teamMembers.find(opt => opt.value === formData.raisedBy) || { label: formData.raisedBy, value: formData.raisedBy } : null}
                onChange={selectedOption => {
                  let value = selectedOption?.value || '';
                  if (value.length > 100) value = value.slice(0, 100);
                  setFormData(f => ({ ...f, raisedBy: value }));
                }}
                classNamePrefix="react-select"
                isSearchable
                isClearable
                placeholder="Select or type name"
                formatCreateLabel={inputValue => `Add \"${inputValue}\"`}
                styles={{
                  control: (base) => ({ ...base, minHeight: '38px', fontSize: '0.95rem', borderColor: errors.raisedBy ? 'red' : base.borderColor }),
                  menu: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
              {errors.raisedBy && <span className="text-red-500 text-xs mt-1 block">{errors.raisedBy}</span>}
            </div>

            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <UserCheck size={14} className="inline mr-1" />
                Owner
                <span className="float-right text-xs text-gray-500">
                  {formData.owner.length}/100 characters
                </span>
              </label>
              <CreatableSelect
                options={teamMembers}
                value={formData.owner ? teamMembers.find(opt => opt.value === formData.owner) || { label: formData.owner, value: formData.owner } : null}
                onChange={selectedOption => {
                  let value = selectedOption?.value || '';
                  if (value.length > 100) value = value.slice(0, 100);
                  setFormData(f => ({ ...f, owner: value }));
                }}
                classNamePrefix="react-select"
                isSearchable
                isClearable
                placeholder="Select or type name"
                formatCreateLabel={inputValue => `Add \"${inputValue}\"`}
                styles={{
                  control: (base) => ({ ...base, minHeight: '38px', fontSize: '0.95rem', borderColor: errors.owner ? 'red' : base.borderColor }),
                  menu: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
              {errors.owner && <span className="text-red-500 text-xs mt-1 block">{errors.owner}</span>}
            </div>
          </div>

          {/* Row 4: Status and Project Name */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CheckCircle size={14} className="inline mr-1" />
                Status *
              </label>
              <Select
                options={statusOptions}
                value={statusOptions.find(opt => opt.value === formData.status) || null}
                onChange={opt => setFormData(f => ({ ...f, status: opt ? opt.value : '' }))}
                isClearable
                placeholder="Select status"
                className="text-sm"
                styles={{ control: (base) => ({ ...base, borderColor: errors.status ? 'red' : base.borderColor }) }}
              />
              {errors.status && <span className="text-red-500 text-xs mt-1 block">{errors.status}</span>}
            </div>

            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Folder size={14} className="inline mr-1" />
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                disabled
                placeholder="Project Name"
              />
            </div>
          </div>

          {/* Row 5: Remarks (large box) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <MessageSquare size={14} className="inline mr-1" />
              Remarks
              <span className="float-right text-xs text-gray-500">
                {formData.remarks.length}/1000 characters
              </span>
            </label>
            <textarea
              value={formData.remarks}
              onChange={e => setFormData(f => ({ ...f, remarks: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
              rows={3}
              placeholder="Enter additional remarks or notes..."
              maxLength={1000}
            />
          </div>

          {/* Row 6: Attachments */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Attachments (Max 4)</label>
            <div className="relative">
              <input
                type="file"
                id="rida-attachment-input"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                disabled={existingAttachments.length + ridaFiles.length >= 4 || uploading}
              />
              <label
                htmlFor="rida-attachment-input"
                className={`w-[300px] h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center cursor-pointer ${existingAttachments.length + ridaFiles.length >= 4 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                style={existingAttachments.length + ridaFiles.length >= 4 ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <span className="text-gray-500 truncate">
                  {ridaFiles.length > 0 ? `${ridaFiles.length} file(s) selected` : 'Click to select files'}
                </span>
              </label>
            </div>
            <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-2">
              {ridaFiles.map((file, index) => (
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
            ) : <FileText size={14} className="mr-2" />}
            {initialData ? 'Update RIDA' : 'Add RIDA'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}