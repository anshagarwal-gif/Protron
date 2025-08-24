import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import GlobalSnackbar from './GlobalSnackbar';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function ReleaseManagement({ projectId, open, onClose }) {
  const [releases, setReleases] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open && projectId) fetchReleases();
  }, [open, projectId]);

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

  const handleAddRelease = () => {
    setAddModalOpen(true);
  };

  const handleEditRelease = (rowIndex) => {
    setEditingRelease(releases[rowIndex]);
    setEditModalOpen(true);
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
    try {
      await fetch(`${API_BASE_URL}/api/releases/${editingRelease.releaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });
      setSnackbar({ open: true, message: 'Release updated', severity: 'success' });
      setEditModalOpen(false);
      fetchReleases();
    } catch (e) {
      setSnackbar({ open: true, message: 'Update failed', severity: 'error' });
    }
  };

  const columnDefs = [
    { headerName: '#', valueGetter: 'node.rowIndex + 1', width: 50 },
    { headerName: 'Release Name', field: 'releaseName', flex: 1 },
    { headerName: 'Start Date', field: 'startDate', width: 140 },
    { headerName: 'End Date', field: 'endDate', width: 140 },
    { headerName: 'Description', field: 'description', flex: 2 },
    { headerName: 'Created On', field: 'createdOn', width: 140 },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 120,
      cellRenderer: (params) => (
        <div className="flex gap-1">
          <button onClick={() => handleEditRelease(params.node.rowIndex)} className="p-1 rounded hover:bg-blue-100 text-blue-600">Edit</button>
          <button onClick={() => handleDeleteRelease(params.node.rowIndex)} className="p-1 rounded hover:bg-red-100 text-red-600">Delete</button>
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
              <button onClick={handleAddRelease} className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">
                Add Release
              </button>
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
          />
          <ReleaseFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSubmit={handleEditSubmit}
            initialData={editingRelease}
          />
        </div>
      </div>
    </>
  );
}

function ReleaseFormModal({ open, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    releaseName: '',
    startDate: '',
    endDate: '',
    description: '',
    projectName: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        releaseName: initialData.releaseName || '',
        startDate: initialData.startDate ? initialData.startDate.substring(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.substring(0, 10) : '',
        description: initialData.description || '',
        projectName: initialData.projectName || initialData.project?.projectName || '',
      });
    } else {
      setFormData({ releaseName: '', startDate: '', endDate: '', description: '', projectName: '' });
    }
  }, [initialData, open]);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.releaseName) errs.releaseName = 'Release name required';
    if (!formData.startDate) errs.startDate = 'Start date required';
    if (!formData.endDate) errs.endDate = 'End date required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) errs.endDate = 'End date must be after start date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
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
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter release name"
                  maxLength={100}
                  required
                />
                {errors.releaseName && <span className="text-red-500 text-xs">{errors.releaseName}</span>}
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
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  required
                />
                {errors.startDate && <span className="text-red-500 text-xs">{errors.startDate}</span>}
              </div>
              <div className="col-span-6">
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  required
                />
                {errors.endDate && <span className="text-red-500 text-xs">{errors.endDate}</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={3}
                placeholder="Enter release description..."
                maxLength={500}
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
              {initialData ? 'Update Release' : 'Add Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
