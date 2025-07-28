import React from 'react';
import { X, Calendar, DollarSign, User, Building, FileText, Hash, Clock } from 'lucide-react';

const ViewPOModal = ({ open, onClose, poData }) => {
  console.log("ViewPOModal opened with PO ID:", poData);

  if (!open || !poData) return null;

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get PO type display name and tag styling
  const getPOTypeDisplay = (type) => {
    switch (type) {
      case 'T_AND_M':
        return 'Time & Material';
      case 'FIXED':
        return 'Fixed Price';
      case 'MIXED':
        return 'Mixed';
      default:
        return type;
    }
  };

  // Function to get tag styling for PO Type (matching SRN modal)
  const getPoTypeTag = (type) => {
    const baseClasses = "px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center";
    switch (type) {
      case "FIXED":
        return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
      case "T_AND_M":
        return `${baseClasses} bg-purple-100 text-purple-700 border border-purple-200`;
      case "MIXED":
        return `${baseClasses} bg-orange-100 text-orange-700 border border-orange-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 border border-gray-200`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000c2] bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full border border-gray-100">
        {/* Header - Matching SRN Modal */}
        <div 
          className="px-8 py-6 flex justify-between items-center rounded-t-2xl"
          style={{ backgroundColor: 'var(--color-green-800)' }}
        >
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-2xl font-bold text-white">Purchase Order Details</h2>
              <p className="text-green-100 text-sm">Comprehensive PO overview and management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
          >
            <X size={24} className="text-white hover:text-black" />
          </button>
        </div>

        <div className="p-8">
          {/* Top Row - Main Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Basic PO Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">PO INFORMATION</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">PO Number</label>
                  <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{poData.poNumber || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">PO Amount</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {formatCurrency(poData.poAmount, poData.poCurrency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">PO Type</label>
                  <div className="mt-2">
                    <span className={getPoTypeTag(poData.poType)}>
                      {getPOTypeDisplay(poData.poType)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">Project Name</label>
                  <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{poData.projectName || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Contact & Timeline Information */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100 h-full">
              <h3 className="text-lg font-semibold text-teal-800 mb-6">CONTACT & TIMELINE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">Customer</label>
                  <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{poData.customer || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">Supplier</label>
                  <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{poData.supplier || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">SPOC</label>
                  <p className="text-gray-900 font-medium mt-1 break-words overflow-wrap-anywhere">{poData.poSpoc || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">Start Date</label>
                  <div className="mt-2 items-center">
                    <span className="text-gray-900 font-medium">
                      {formatDate(poData.poStartDate)}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-teal-700 uppercase tracking-wide">End Date</label>
                  <div className="mt-2 items-center">
                    <span className="text-gray-900 font-medium">
                      {formatDate(poData.poEndDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Description Section */}
          <div className="">
            {/* PO Description */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">PO DESCRIPTION</h3>
              <div className="min-h-[120px]">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {poData.poDesc || "No description available"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPOModal;