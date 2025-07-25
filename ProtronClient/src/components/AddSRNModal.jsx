// AddSRNModal.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    X,
    Calendar,
    Folder,
    User,
    Building,
    DollarSign,
    FileText,
    Receipt,
    Hash,
    MessageSquare,
    Upload
} from 'lucide-react';

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NOK: 'kr'
};

const AddSRNModal = ({ open, onClose }) => {
    const [formData, setFormData] = useState({
        poId: '',
        poNumber: '',
        msId: '',
        srnName: '',
        srnDsc: '',
        srnAmount: '',
        srnCurrency: 'USD',
        srnRemarks: '',
        srnAttachment: null,
        srnType: 'partial'
    });

    const [poList, setPOList] = useState([]);
    const [milestoneList, setMilestoneList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch PO list
    const fetchPOList = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po/all`, {
                headers: { Authorization: `${token}` }
            });
            const data = await response.json();
            setPOList(data);
        } catch (error) {
            console.error('Error fetching PO list:', error);
        }
    };

    // Fetch milestones for selected PO
    const fetchMilestones = async (poId) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`, {
                headers: { Authorization: `${token}` }
            });
            const data = await response.json();
            setMilestoneList(data);
        } catch (error) {
            console.error('Error fetching milestones:', error);
            setMilestoneList([]);
        }
    };

    const checkExistingSRNs = async (poId, msId = null) => {
        try {
            const token = sessionStorage.getItem('token');
            const url = msId
                ? `${import.meta.env.VITE_API_URL}/api/srn/check?poId=${poId}&msId=${msId}`
                : `${import.meta.env.VITE_API_URL}/api/srn/check?poId=${poId}`;
            const response = await fetch(url, {
                headers: { Authorization: `${token}` }
            });
            const data = await response.json();
            return data; // Assume API returns a boolean
        } catch (error) {
            console.error('Error checking existing SRNs:', error);
            return true; // Default to true to prevent invalid SRNs
        }
    };

    useEffect(() => {
        if (open) {
            fetchPOList();
        }
    }, [open]);

    const handleChange = (field) => async (event) => {
        const value = event.target.value;

        // Enforce character limits
        if (field === 'srnName' && value.length > 100) {
            alert('SRN Name cannot exceed 100 characters.');
            return;
        }
        if (field === 'srnDsc' && value.length > 500) {
            alert('SRN Description cannot exceed 500 characters.');
            return;
        }
        if (field === 'srnRemarks' && value.length > 500) {
            alert('SRN Remarks cannot exceed 500 characters.');
            return;
        }

        // Handle changes to srnType
        if (field === 'srnType') {
            if (value === 'full') {
                if (formData.msId) {
                    const hasExistingSRNs = await checkExistingSRNs(formData.poId, formData.msId);
                    if (hasExistingSRNs) {
                        alert('This milestone already has SRNs. Full SRN is not allowed.');
                        return;
                    }

                    const selectedMilestone = milestoneList.find(m => m.msId == formData.msId);
                    if (selectedMilestone) {
                        setFormData(prev => ({
                            ...prev,
                            srnAmount: selectedMilestone.msAmount || '',
                            srnType: value
                        }));
                    }
                } else {
                    const hasExistingSRNs = await checkExistingSRNs(formData.poId);
                    if (hasExistingSRNs) {
                        alert('This PO already has SRNs. Full SRN is not allowed.');
                        return;
                    }

                    const selectedPO = poList.find(po => po.poId == formData.poId);
                    if (selectedPO) {
                        setFormData(prev => ({
                            ...prev,
                            srnAmount: selectedPO.poAmount || '',
                            srnType: value
                        }));
                    }
                }
            } else {
                setFormData(prev => ({
                    ...prev,
                    srnType: value,
                    srnAmount: ''
                }));
            }
        } else if (field === 'poId') {
            const selectedPO = poList.find(po => po.poId == value);
            if (selectedPO) {
                setFormData(prev => ({
                    ...prev,
                    poId: value,
                    poNumber: selectedPO.poNumber || '',
                    srnCurrency: selectedPO.poCurrency || 'USD',
                    msId: '',
                    srnAmount: ''
                }));
                fetchMilestones(value);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };


    const handleFileChange = (field) => (event) => {
        const file = event.target.files[0];
        setFormData((prev) => ({
            ...prev,
            [field]: file
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Validation
            if (!formData.poId) {
                alert('Please select a PO');
                return;
            }
            if (milestoneList.length > 0 && !formData.msId) {
                alert('Please select a Milestone');
                return;
            }
            if (!formData.srnName.trim()) {
                alert('Please enter SRN name');
                return;
            }
            if (!formData.srnAmount || formData.srnAmount <= 0) {
                alert('Please enter a valid SRN amount');
                return;
            }

            const srnPayload = {
                poId: parseInt(formData.poId),
                poNumber: formData.poNumber,
                msId: parseInt(formData.msId),
                srnName: formData.srnName.trim(),
                srnDsc: formData.srnDsc.trim() || '',
                srnAmount: parseInt(formData.srnAmount),
                srnCurrency: formData.srnCurrency,
                srnRemarks: formData.srnRemarks.trim() || '',
                srnType: formData.srnType,

            };

            console.log('SRN Payload:', srnPayload);

            const token = sessionStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/srn/add`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(srnPayload)
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('SRN Created:', data);

                // TODO: Handle file upload if attachment is selected
                if (formData.srnAttachment) {
                    console.log('File attachment to be implemented:', formData.srnAttachment);
                }



                onClose();
            } else {
                const errorData = await response.text();
                console.error('SRN Creation Error:', errorData);
                alert('Failed to create SRN. Please check the console for details.');
            }
        } catch (error) {
            console.error('Error creating SRN:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-semibold text-green-900 flex items-center">
                        <Receipt size={24} className="mr-2 text-green-600" />
                        Create New SRN
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-6">
                        {/* First Row - SRN ID, PO Number, Select PO, SRN Name */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">PO Number</label>
                                <input
                                    type="text"
                                    placeholder="Auto-filled from PO"
                                    value={formData.poNumber}
                                    onChange={handleChange('poNumber')}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select PO <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                    <select
                                        value={formData.poId}
                                        onChange={handleChange('poId')}
                                        className="w-full h-10 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    >
                                        <option value="">Select PO</option>
                                        {poList.map((po) => (
                                            <option key={po.poId} value={po.poId}>
                                                {po.poNumber} - {po.projectName || 'No Project'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className='flex justify-between items-center mb-2'>
                                    <label className="block text-sm font-medium text-gray-700">
                                    SRN Name <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-gray-500">
                                        {formData.srnName.length}/100 characters
                                    </p>
                                </div>
                                <div className="relative">
                                    <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter SRN name"
                                        value={formData.srnName}
                                        onChange={handleChange('srnName')}
                                        className="w-full h-10 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        maxLength={100} // Enforce limit
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Second Row - Milestone Name, Currency, SRN Amount, Attachment */}
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SRN Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.srnType}
                                    onChange={handleChange('srnType')}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                >
                                    <option value="partial">Partial</option>
                                    <option value="full">Full</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Milestone Name</label>
                                <div className="relative">
                                    <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                    <select
                                        value={formData.msId}
                                        onChange={handleChange('msId')}
                                        className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        disabled={!formData.poId}
                                    >
                                        <option value="">Select milestone (optional)</option>
                                        {milestoneList.map((milestone) => (
                                            <option key={milestone.msId} value={milestone.msId}>
                                                {milestone.msName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                <select
                                    value={formData.srnCurrency}
                                    onChange={handleChange('srnCurrency')}
                                    disabled
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="USD">USD</option>
                                    <option value="INR">INR</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="JPY">JPY</option>
                                    <option value="CAD">CAD</option>
                                    <option value="AUD">AUD</option>
                                    <option value="CHF">CHF</option>
                                    <option value="CNY">CNY</option>
                                    <option value="SEK">SEK</option>
                                    <option value="NOK">NOK</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SRN Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">
                                        {currencySymbols[formData.srnCurrency] || '$'}
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={formData.srnAmount}
                                        onChange={handleChange('srnAmount')}
                                        min="0"
                                        step="0.01"
                                        className="w-full h-10 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">SRN Attachment</label>
                                <div className="relative">
                                    <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                    <input
                                        type="file"
                                        onChange={handleFileChange('srnAttachment')}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                                        className="w-full h-10 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Third Row - SRN Description */}
                        <div>
                           <div className='flex justify-between items-center mb-2'>
                             <label className="block text-sm font-medium text-gray-700">SRN Description</label>
                            <p className="text-xs text-gray-500">
                                    {formData.srnDsc.length}/500 characters
                                </p>
                           </div>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-4 text-green-600" size={20} />
                                <textarea
                                    placeholder="Enter SRN description"
                                    rows={4}
                                    value={formData.srnDsc}
                                    onChange={handleChange('srnDsc')}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    maxLength={500} // Enforce limit
                                />
                                
                            </div>
                        </div>

                        {/* Fourth Row - SRN Remarks */}
                        <div>
                            <div className='flex justify-between items-center mb-2'>
                                <label className="block text-sm font-medium text-gray-700">SRN Remarks</label>
                            <p className="text-xs text-gray-500">
                                    {formData.srnRemarks.length}/500 characters
                                </p>
                            </div>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-4 text-green-600" size={20} />
                                <textarea
                                    placeholder="Enter remarks (optional)"
                                    rows={3}
                                    value={formData.srnRemarks}
                                    onChange={handleChange('srnRemarks')}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    maxLength={500} // Enforce limit
                                />
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">

                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create SRN'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSRNModal;