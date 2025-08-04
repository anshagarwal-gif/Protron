import React from 'react';
import { X, Calendar, DollarSign, User, Building, FileText, Hash, Clock, MapPin, Target, CreditCard, Users } from 'lucide-react';

const ViewPOModal = ({ open, onClose, poData }) => {
  console.log("ViewPOModal opened with PO ID:", poData);

  if (!open || !poData) return null;

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'N/A';
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
        return type || 'N/A';
    }
  };

  // Function to get tag styling for PO Type
  const getPoTypeTag = (type) => {
    const baseClasses = "px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center shadow-sm";
    switch (type) {
      case "FIXED":
        return `${baseClasses} bg-emerald-100 text-emerald-800 border border-emerald-200`;
      case "T_AND_M":
        return `${baseClasses} bg-violet-100 text-violet-800 border border-violet-200`;
      case "MIXED":
        return `${baseClasses} bg-amber-100 text-amber-800 border border-amber-200`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700 border border-slate-200`;
    }
  };

  // Field component for consistent styling
  const Field = ({ label, value, icon: Icon, className = "", colSpan = 1 }) => (
    <div className={`${colSpan > 1 ? `col-span-${colSpan}` : ''} ${className}`}>
      <div className="flex items-center mb-2">
        {Icon && <Icon size={16} className="text-slate-500 mr-2" />}
        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      </div>
      <div className="text-slate-900 font-medium break-words overflow-wrap-anywhere">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000006b] bg-opacity-60 p-4 scrollbar-hide">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full border border-slate-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-teal-800 to-teal-900 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <FileText size={28} className="text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Purchase Order Details</h2>
                <p className="text-slate-300 mt-1">PO #{poData.poNumber || 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 group"
            >
              <X size={24} className="text-white group-hover:text-slate-200" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Overview Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Hash className="mr-3 text-blue-600" size={24} />
              PO Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Field 
                label="PO Number" 
                value={poData.poNumber} 
                icon={Hash}
              />
              <Field 
                label="PO Amount" 
                value={formatCurrency(poData.poAmount, poData.poCurrency)} 
                // icon={DollarSign}
              />
              <Field 
                label="PO Type" 
                value={<span className={getPoTypeTag(poData.poType)}>{getPOTypeDisplay(poData.poType)}</span>} 
              />
              <Field 
                label="Currency" 
                value={poData.poCurrency} 
                icon={CreditCard}
              />
              <Field 
                label="Project Name" 
                value={poData.projectName} 
                icon={Building}
              />
              <Field 
                label="Country" 
                value={poData.poCountry} 
                icon={MapPin}
              />
              <Field 
                label="SPOC" 
                value={poData.poSpoc} 
                icon={User}
              />
              <Field 
                  label="Start Date" 
                  value={formatDate(poData.poStartDate)} 
                  icon={Calendar}
                />
                <Field 
                  label="End Date" 
                  value={formatDate(poData.poEndDate)} 
                  icon={Calendar}
                />
                <Field 
                  label="Customer" 
                  value={poData.customer} 
                  icon={Building}
                />
            </div>
          </div>
          

          {/* Sponsor & Budget Information */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Target className="mr-3 text-orange-600" size={24} />
              Sponsor & Budget Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Field 
                  label="Supplier" 
                  value={poData.supplier} 
                  icon={Building}
                />
              <Field 
                label="Sponsor Name" 
                value={poData.sponsorName} 
                icon={User}
              />
              <Field 
                label="Sponsor LOB" 
                value={poData.sponsorLob} 
                icon={Building}
              />
              <Field 
                label="Budget Line Item" 
                value={poData.budgetLineItem} 
                icon={FileText}
              />
              <Field 
                label="Budget Line Amount" 
                value={formatCurrency(poData.budgetLineAmount, poData.poCurrency)} 
                icon={DollarSign}
              />
              <Field 
                label="Business Value Amount" 
                value={formatCurrency(poData.businessValueAmount, poData.poCurrency)} 
                icon={DollarSign}
              />
              
                <Field 
                  label="Budget Line Remarks" 
                  value={poData.budgetLineRemarks} 
                  icon={FileText}
                  colSpan={3}
                />
              
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <FileText className="mr-3 text-slate-600" size={24} />
              PO Description
            </h3>
            <div className="bg-white rounded-xl p-6 border border-slate-200 min-h-[120px]">
              <p className="text-slate-900 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {poData.poDesc || "No description available"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 rounded-b-3xl border-t border-slate-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPOModal;