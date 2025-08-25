import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Edit, FileText, Eye } from 'lucide-react';
import AddMilestoneModal from './AddMilestoneModal';
import GlobalSnackbar from './GlobalSnackbar';
import { AgGridReact } from 'ag-grid-react';
import axios from 'axios';
import EditMilestoneModal from './EditMilestoneModal';
import ViewMilestoneModal from './ViewMilestoneModal';

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
};

const MilestoneManagement = ({ poId, open, onClose }) => {
    const [milestones, setMilestones] = useState([]);
    const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [isEditMilestoneModalOpen, setIsEditMilestoneModalOpen] = useState(false);
    const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
    const [viewMilestoneModalOpen, setViewMilestoneModalOpen] = useState(false)
    const [selectedMilestone, setSelectedMilestone] = useState(null);

    useEffect(() => {
        if (open && poId) {
            fetchMilestones();
        }
    }, [open, poId]);

    const fetchMilestones = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`,
                {
                    headers: { Authorization: `${token}` }
                }
            );
            setMilestones(response.data || []);
        } catch (error) {
            console.error('Error fetching milestones:', error);
        }
    };

    const handleAddMilestone = () => {
        setEditingMilestone(null);
        setMilestoneModalOpen(true);
    };

    const handleEditMilestone = (index) => {
        setSelectedMilestoneId(milestones[index].msId);
        setIsEditMilestoneModalOpen(true);
    };
    const handleViewMilestone = (index) =>{
        setViewMilestoneModalOpen(true);
        console.log(milestones[index].msId);
        setSelectedMilestone(milestones[index]);
    }

    const handleMilestoneSubmit = (milestoneData) => {

        const transformedMilestone = {
            msId: milestoneData.msId || null,
            msName: milestoneData.milestoneName || "",
            msDesc: milestoneData.milestoneDescription || "",
            msAmount: milestoneData.amount || 0,
            msCurrency: milestoneData.currency || "USD",
            msDate: milestoneData.date || null,
            msDuration: milestoneData.duration || 0,
            msRemarks: milestoneData.remark || ""
        }

        if (editingMilestone !== null) {
            const updatedMilestones = [...milestones];
            updatedMilestones[editingMilestone] = transformedMilestone;
            setMilestones(updatedMilestones);
        } else {
            setMilestones([...milestones, transformedMilestone]);
        }
        setMilestoneModalOpen(false);
        setEditingMilestone(null);
        setSnackbar({ open: true, message: 'Milestone saved!', severity: 'success' });
    };

    const handleEditMilestoneModalSubmit = (updatedMilestone) => {

        // Find the index of the milestone being edited
        const index = milestones.findIndex(m => m.msId === selectedMilestoneId);
        if (index !== -1) {
            const updatedMilestones = [...milestones];
            updatedMilestones[index] = updatedMilestone;
            setMilestones(updatedMilestones);
        }
        setIsEditMilestoneModalOpen(false);
        setSelectedMilestoneId(null);
        setSnackbar({ open: true, message: 'Milestone updated!', severity: 'success' });
    };

    const handleRemoveMilestone = async (index) => {
        const milestoneToRemove = milestones[index];
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/delete/${milestoneToRemove.msId}`, {
                method: 'DELETE',
                headers: { Authorization: `${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert(`Failed to delete milestone. ${errorData?.message || ''}`);
                return;
            }
            setMilestones(milestones.filter((_, i) => i !== index));
            setSnackbar({ open: true, message: 'Milestone deleted!', severity: 'success' });
        } catch (error) {
            alert('Network error. Please try again.');
        }
    };

    const milestoneColumnDefs = [
        {
            headerName: '#',
            valueGetter: 'node.rowIndex + 1',
            width: 50,
            pinned: 'left',
            cellStyle: { textAlign: 'center' },
            sortable: false,
            filter: false
        },
        {
            headerName: 'Milestone Name',
            field: 'msName',
            flex: 1,
            editable: false
        },
        {
            headerName: 'Milestone Description',
            field: 'msDesc',
            flex: 2,
            editable: false,
            cellRenderer: (params) => {
                const description = params.value || '';
                return description.length > 50 ?
                    <span title={description}>{description.substring(0, 50)}...</span> :
                    description;
            }
        },
        {
            headerName: 'Currency',
            field: 'msCurrency',
            width: 100,
            editable: false
        },
        {
            headerName: 'Amount',
            field: 'msAmount',
            width: 120,
            editable: false,
            valueFormatter: (params) => {
                const amount = params.value;

                return amount ? `${Number(amount).toLocaleString()}` : '';
            }
        },

        {
            headerName: 'Date',
            field: 'msDate',
            width: 150,
            editable: false,
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString() : 'null';
            }
        },
        {
            headerName: 'Duration (Days)',
            field: 'msDuration',
            width: 130,
            editable: false
        },
        {
            headerName: 'Remark',
            field: 'msRemarks',
            flex: 1,
            editable: false,
            cellRenderer: (params) => {
                const remark = params.value || '';
                return remark.length > 30 ?
                    <span title={remark}>{remark.substring(0, 30)}...</span> :
                    remark;
            }
        },
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex justify-center items-center h-full gap-1">
                    <button
                        onClick={() => handleViewMilestone(params.node.rowIndex)}
                        className="p-1 rounded-full hover:bg-blue-100 text-blue-600 cursor-pointer transition-colors"
                        title="View milestone"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => handleEditMilestone(params.node.rowIndex)}
                        className="p-1 rounded-full hover:bg-blue-100 text-blue-600 cursor-pointer transition-colors"
                        title="Edit milestone"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleRemoveMilestone(params.node.rowIndex)}
                        className="p-1 rounded-full hover:bg-red-100 text-red-600 cursor-pointer transition-colors"
                        title="Remove milestone"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        }
    ];

    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-green-900">Milestones Management</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            Close
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-green-900">Milestones Details</h3>
                            <button
                                onClick={handleAddMilestone}
                                className="flex items-center px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
                            >
                                <Plus size={16} className="mr-2" />
                                Add Milestone
                            </button>
                        </div>
                        <div className="h-96 w-full border border-gray-200 rounded-md">
                            <div className="ag-theme-alpine h-full w-full">
                                <AgGridReact
                                    columnDefs={milestoneColumnDefs}
                                    rowData={milestones}
                                    defaultColDef={defaultColDef}
                                    suppressMovableColumns={true}
                                    enableCellTextSelection={true}
                                    suppressRowClickSelection={true}
                                    animateRows={true}
                                    rowHeight={48}
                                    headerHeight={48}
                                    noRowsOverlayComponent={() => (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                                        
                                            <div className="text-center">
                                                <p className="text-lg font-medium">No milestones added yet</p>
                                                <p className="text-sm">Click "Add Milestone" above to get started</p>
                                            </div>
                                        </div>
                                    )}
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
                    <AddMilestoneModal
                        open={milestoneModalOpen}
                        onClose={() => {
                            setMilestoneModalOpen(false);
                            setEditingMilestone(null);
                        }}
                        onSubmit={handleMilestoneSubmit}
                        poId={poId}
                        milestone={editingMilestone !== null ? milestones[editingMilestone] : null}
                    />
                    <EditMilestoneModal
                        open={isEditMilestoneModalOpen}
                        onClose={() => {
                            setIsEditMilestoneModalOpen(false);
                            setSelectedMilestoneId(null);
                        }}
                        onSubmit={handleEditMilestoneModalSubmit}
                        milestoneId={selectedMilestoneId}
                    />
                    <ViewMilestoneModal
                        open={viewMilestoneModalOpen}
                        onClose={() => setViewMilestoneModalOpen(false)}
                        milestoneData={selectedMilestone}
                    />
                </div>
            </div>
        </>
    );
};

export default MilestoneManagement;
