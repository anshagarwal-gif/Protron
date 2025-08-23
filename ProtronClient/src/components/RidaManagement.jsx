import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, FileText, X, Tag, Calendar, User, UserCheck, CheckCircle, Folder, MessageSquare } from 'lucide-react';
import axios from 'axios';
import GlobalSnackbar from './GlobalSnackbar';
import CreatableSelect from 'react-select/creatable';
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open && projectId) fetchRidas();
  }, [open, projectId]);

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

  const handleAddRida = () => {
    setEditingRida(null);
    setAddModalOpen(true);
  };

  const handleEditRida = (rowIndex) => {
    setEditingRida(ridas[rowIndex]);
    setEditModalOpen(true);
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

  const handleAddSubmit = async (formData) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/rida/project/${projectId}`, formData, {
        headers: { Authorization: token }
      });
      setAddModalOpen(false);
      setSnackbar({ open: true, message: 'RIDA added!', severity: 'success' });
      fetchRidas();
    } catch (err) {
      setSnackbar({ open: true, message: 'Add failed', severity: 'error' });
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/rida/${editingRida.id}`, formData, {
        headers: { Authorization: token }
      });
      setEditModalOpen(false);
      setSnackbar({ open: true, message: 'RIDA updated!', severity: 'success' });
      fetchRidas();
    } catch (err) {
      setSnackbar({ open: true, message: 'Update failed', severity: 'error' });
    }
  };

  const columnDefs = [
    { headerName: '#', valueGetter: 'node.rowIndex + 1', width: 50 },
    { headerName: 'Type', field: 'type', width: 100 },
    { headerName: 'Meeting Ref', field: 'meetingReference', flex: 1 },
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
          <button onClick={() => handleEditRida(params.node.rowIndex)} className="p-1 rounded hover:bg-blue-100 text-blue-600">Edit</button>
          <button onClick={() => handleDeleteRida(params.node.rowIndex)} className="p-1 rounded hover:bg-red-100 text-red-600"><Trash2 size={16} /></button>
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
              <button onClick={handleAddRida} className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">
                <Plus size={16} className="mr-2" /> Add RIDA
              </button>
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
          />
          <RidaFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSubmit}
            initialData={editingRida}
          />
        </div>
      </div>
    </>
  );
}

// Modal for Add/Edit RIDA
function RidaFormModal({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    meetingReference: '',
    itemDescription: '',
    type: '',
    raisedBy: '',
    owner: '',
    status: '',
    remarks: '',
    projectName: ''
  });

  useEffect(() => {
    if (initialData) setFormData({ ...initialData });
    else setFormData({
      meetingReference: '',
      itemDescription: '',
      type: '',
      raisedBy: '',
      owner: '',
      status: '',
      remarks: '',
      projectName: ''
    });
  }, [initialData, open]);

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
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit(formData);
        }}
        className="p-6 space-y-4"
      >
        <div className="space-y-4">
          {/* Row 1: Type and Meeting Reference */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Tag size={14} className="inline mr-1" />
                Type *
              </label>
              <CreatableSelect
                options={typeOptions}
                value={typeOptions.find(opt => opt.value === formData.type) || (formData.type ? { label: formData.type, value: formData.type } : null)}
                onChange={opt => setFormData(f => ({ ...f, type: opt ? opt.value : '' }))}
                isClearable
                placeholder="Select or type"
                className="text-sm"
              />
            </div>

            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Meeting Reference
                <span className="float-right text-xs text-gray-500">
                  {formData.meetingReference.length}/100 characters
                </span>
              </label>
              <input
                type="text"
                value={formData.meetingReference}
                onChange={e => setFormData(f => ({ ...f, meetingReference: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter meeting reference"
                maxLength={100}
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
              rows={4}
              placeholder="Enter detailed item description..."
              maxLength={500}
              required
            />
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
              <input
                type="text"
                value={formData.raisedBy}
                onChange={e => setFormData(f => ({ ...f, raisedBy: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter who raised this item"
                maxLength={100}
              />
            </div>

            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <UserCheck size={14} className="inline mr-1" />
                Owner
                <span className="float-right text-xs text-gray-500">
                  {formData.owner.length}/100 characters
                </span>
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={e => setFormData(f => ({ ...f, owner: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter owner name"
                maxLength={100}
              />
            </div>
          </div>

          {/* Row 4: Status and Project Name */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <CheckCircle size={14} className="inline mr-1" />
                Status *
              </label>
              <CreatableSelect
                options={statusOptions}
                value={statusOptions.find(opt => opt.value === formData.status) || (formData.status ? { label: formData.status, value: formData.status } : null)}
                onChange={opt => setFormData(f => ({ ...f, status: opt ? opt.value : '' }))}
                isClearable
                placeholder="Select or type status"
                className="text-sm"
              />
            </div>

            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Folder size={14} className="inline mr-1" />
                Project Name
                <span className="float-right text-xs text-gray-500">
                  {formData.projectName.length}/100 characters
                </span>
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={e => setFormData(f => ({ ...f, projectName: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter project name"
                maxLength={100}
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
          >
            <FileText size={14} className="mr-2" />
            {initialData ? 'Update RIDA' : 'Add RIDA'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}