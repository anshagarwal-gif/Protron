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
        msName: '',
        srnName: '',
        srnDsc: '',
        srnAmount: '',
        srnCurrency: 'USD',
        srnRemarks: '',
        srnAttachment: null
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

    useEffect(() => {
        if (open) {
            fetchPOList();
        }
    }, [open]);

    const handleChange = (field) => (event) => {
        const value = event.target.value;
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));

        // When PO is selected, fetch its milestones and auto-fill PO number
        if (field === 'poId' && value) {
            const selectedPO = poList.find(po => po.poId == value);
            if (selectedPO) {
                setFormData(prev => ({
                    ...prev,
                    poNumber: selectedPO.poNumber || '',
                    srnCurrency: selectedPO.poCurrency || 'USD'
                }));
                fetchMilestones(value);
            }
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
                msName: formData.msName || '',
                srnName: formData.srnName.trim(),
                srnDsc: formData.srnDsc.trim() || '',
                srnAmount: parseInt(formData.srnAmount),
                srnCurrency: formData.srnCurrency,
                srnRemarks: formData.srnRemarks.trim() || '',
               
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
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">SRN ID</label>
                                <input
                                    type="text"
                                    placeholder="Auto-generated"
                                    disabled
                                    className="w-full h-14 px-4 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">PO Number</label>
                                <input
                                    type="text"
                                    placeholder="Auto-filled from PO"
                                    value={formData.poNumber}
                                    onChange={handleChange('poNumber')}
                                    className="w-full h-14 px-4 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                                        className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SRN Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter SRN name"
                                        value={formData.srnName}
                                        onChange={handleChange('srnName')}
                                        className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Second Row - Milestone Name, Currency, SRN Amount, Attachment */}
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Milestone Name</label>
                                <div className="relative">
                                    <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" size={20} />
                                    <select
                                        value={formData.msName}
                                        onChange={handleChange('msName')}
                                        className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        disabled={!formData.poId}
                                    >
                                        <option value="">Select milestone (optional)</option>
                                        {milestoneList.map((milestone) => (
                                            <option key={milestone.msId} value={milestone.msName}>
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
                                    className="w-full h-14 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                                        className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                                        className="w-full h-14 pl-12 pr-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Third Row - SRN Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SRN Description</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-4 text-green-600" size={20} />
                                <textarea
                                    placeholder="Enter SRN description"
                                    rows={4}
                                    value={formData.srnDsc}
                                    onChange={handleChange('srnDsc')}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Fourth Row - SRN Remarks */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SRN Remarks</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-4 text-green-600" size={20} />
                                <textarea
                                    placeholder="Enter remarks (optional)"
                                    rows={3}
                                    value={formData.srnRemarks}
                                    onChange={handleChange('srnRemarks')}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
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