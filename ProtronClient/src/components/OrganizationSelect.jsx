import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const OrganizationSelect = ({ 
    value, 
    onChange, 
    placeholder = "Search for organizations...", 
    isMulti = false,
    orgType = null, // 'CUSTOMER', 'SUPPLIER', etc.
    className = "",
    isDisabled = false,
    onBlur = null,
    onOrgSelect = null // New callback for when organization is selected with full details
}) => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch organizations based on type if specified
    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            let endpoint = `${API_BASE_URL}/api/organizations/tenant`;
            
            if (orgType) {
                endpoint = `${API_BASE_URL}/api/organizations/type/${orgType}`;
            }
            
            const token = sessionStorage.getItem('token');
            const response = await axios.get(endpoint, {
                headers: { Authorization: token }
            });
            
            setOrganizations(response.data);
        } catch (error) {
            console.error('Error fetching organizations:', error);
            // If type-specific endpoint fails, fallback to tenant endpoint
            if (orgType) {
                try {
                    const token = sessionStorage.getItem('token');
                    const fallbackResponse = await axios.get(`${API_BASE_URL}/api/organizations/tenant`, {
                        headers: { Authorization: token }
                    });
                    setOrganizations(fallbackResponse.data);
                } catch (fallbackError) {
                    console.error('Fallback endpoint also failed:', fallbackError);
                    setOrganizations([]);
                }
            } else {
                setOrganizations([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, [orgType]);

    // Create options for the dropdown
    const organizationOptions = organizations.map(org => ({
        value: org.orgName,
        label: org.orgName,
        data: org // Keep full organization data for reference
    }));

    // Handle selection change
    const handleChange = (selected) => {
        if (isMulti) {
            // For multi-select, extract values
            const values = selected?.map(item => item.value) || [];
            onChange(values);
            
            // Call onOrgSelect with full organization data if provided
            if (onOrgSelect) {
                const orgData = selected?.map(item => item.data) || [];
                onOrgSelect(orgData);
            }
        } else {
            // For single-select, extract value
            const value = selected?.value || '';
            onChange(value);
            
            // Call onOrgSelect with full organization data if provided
            if (onOrgSelect) {
                onOrgSelect(selected?.data || null);
            }
        }
    };

    // Get current value for the dropdown
    const getCurrentValue = () => {
        if (isMulti) {
            // For multi-select, map array of strings to option objects
            return (value || []).map(item => ({
                value: item,
                label: item
            }));
        } else {
            // For single-select, map string to option object
            return value ? { value, label: value } : null;
        }
    };

    return (
        <CreatableSelect
            options={organizationOptions}
            value={getCurrentValue()}
            onChange={handleChange}
            placeholder={placeholder}
            isClearable
            isMulti={isMulti}
            isSearchable
            isLoading={loading}
            isDisabled={isDisabled}
            onBlur={onBlur}
            className={className}
            styles={{
                control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    fontSize: '14px'
                }),
                menuPortal: base => ({ ...base, zIndex: 9999 }),
                menu: base => ({ ...base, zIndex: 9999 })
            }}
            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
            noOptionsMessage={() => loading ? "Loading organizations..." : "No organizations found. Type to create new one."}
            loadingMessage={() => "Loading organizations..."}
            createOptionPosition="first"
        />
    );
};

export default OrganizationSelect;

