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
      const res = await fetch(`${API_BASE_URL}/releases/project/${projectId}`);
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
      await fetch(`${API_BASE_URL}/releases/${releaseId}`, { method: 'DELETE' });
      setSnackbar({ open: true, message: 'Release deleted', severity: 'success' });
      fetchReleases();
    } catch (e) {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    }
  };

  const handleAddSubmit = async (formData) => {
    try {
      await fetch(`${API_BASE_URL}/releases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_BASE_URL}/releases/${editingRelease.releaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        releaseName: initialData.releaseName || '',
        startDate: initialData.startDate ? initialData.startDate.substring(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.substring(0, 10) : '',
        description: initialData.description || '',
      });
    } else {
      setFormData({ releaseName: '', startDate: '', endDate: '', description: '' });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
        <h3 className="text-lg font-semibold mb-4">{initialData ? 'Edit Release' : 'Add Release'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium">Release Name</label>
            <input name="releaseName" value={formData.releaseName} onChange={handleChange} className="border rounded w-full p-2" />
            {errors.releaseName && <span className="text-red-500 text-xs">{errors.releaseName}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="border rounded w-full p-2" />
            {errors.startDate && <span className="text-red-500 text-xs">{errors.startDate}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="border rounded w-full p-2" />
            {errors.endDate && <span className="text-red-500 text-xs">{errors.endDate}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="border rounded w-full p-2" />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-green-700 text-white rounded">{initialData ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
