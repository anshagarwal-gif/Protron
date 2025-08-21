// This file shows how to use OrganizationSelect component in different modals
// for Customer Name and Supplier Name fields

import React, { useState } from 'react';
import OrganizationSelect from './OrganizationSelect';

// Example 1: Single Customer Name field
const CustomerNameField = ({ value, onChange, disabled = false }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
            </label>
            <OrganizationSelect
                value={value}
                onChange={onChange}
                placeholder="Search for customer or type new..."
                orgType="CUSTOMER"
                isDisabled={disabled}
            />
            <div className="text-xs text-gray-600 mt-1">
                Select existing customer or type to create new one.
            </div>
        </div>
    );
};

// Example 2: Single Supplier Name field
const SupplierNameField = ({ value, onChange, disabled = false }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name
            </label>
            <OrganizationSelect
                value={value}
                onChange={onChange}
                placeholder="Search for supplier or type new..."
                orgType="SUPPLIER"
                isDisabled={disabled}
            />
            <div className="text-xs text-gray-600 mt-1">
                Select existing supplier or type to create new one.
            </div>
        </div>
    );
};

// Example 3: Multiple Customer Names (for cases where you need multiple customers)
const MultipleCustomerNamesField = ({ value, onChange, disabled = false }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Names
            </label>
            <OrganizationSelect
                value={value}
                onChange={onChange}
                placeholder="Search for customers or type new..."
                orgType="CUSTOMER"
                isMulti={true}
                isDisabled={disabled}
            />
            <div className="text-xs text-gray-600 mt-1">
                Select multiple customers or type to create new ones.
            </div>
        </div>
    );
};

// Example 4: Generic Organization field (no specific type)
const GenericOrganizationField = ({ value, onChange, label, placeholder, disabled = false }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <OrganizationSelect
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                isDisabled={disabled}
            />
            <div className="text-xs text-gray-600 mt-1">
                Select existing organization or type to create new one.
            </div>
        </div>
    );
};

// Example 5: How to use in a modal form
const ExampleModalForm = () => {
    const [formData, setFormData] = useState({
        customerName: '',
        supplierName: '',
        multipleCustomers: [],
        genericOrg: ''
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data:', formData);
        // Submit form data
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Name */}
            <CustomerNameField
                value={formData.customerName}
                onChange={(value) => handleChange('customerName', value)}
            />

            {/* Supplier Name */}
            <SupplierNameField
                value={formData.supplierName}
                onChange={(value) => handleChange('supplierName', value)}
            />

            {/* Multiple Customer Names */}
            <MultipleCustomerNamesField
                value={formData.multipleCustomers}
                onChange={(value) => handleChange('multipleCustomers', value)}
            />

            {/* Generic Organization */}
            <GenericOrganizationField
                value={formData.genericOrg}
                onChange={(value) => handleChange('genericOrg', value)}
                label="Partner Organization"
                placeholder="Search for partner organization or type new..."
            />

            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Submit
            </button>
        </form>
    );
};

export {
    CustomerNameField,
    SupplierNameField,
    MultipleCustomerNamesField,
    GenericOrganizationField,
    ExampleModalForm
};

