import React, { useState, useEffect, useRef, useCallback } from "react";
import CreatableSelect from 'react-select/creatable';
import {
  FileText,
    X,
  Trash2,
  File,
  Upload,
    Calendar,
    User,
    Building,
    DollarSign,
    Plus,
    CreditCard,
    Clock,
    MessageSquare,
    Paperclip,
} from "lucide-react";
import axios from "axios";
import GlobalSnackbar from "./GlobalSnackbar";

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
};

const AddBudgetLineModal = ({ open, onClose, onSubmit, budgetLine, isEdit = false }) => {
    const [formData, setFormData] = useState({
        budgetName: '',
        budgetDescription: '',
        budgetLineItem: '',
        budgetEndDate: '',
        budgetOwner: '',
        sponsor: '',
        lob: '',
        currency: 'USD',
        amountApproved: '',
        amountUtilized: '0',
        amountAvailable: '',
        remarks: '',
        lastUpdatedBy: sessionStorage.getItem('userName') || ''
    });

    const [employees, setEmployees] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Multiple documents support (up to 4 files)
    const [documents, setDocuments] = useState([]);
    const [originalDocuments, setOriginalDocuments] = useState([]); // Track original documents when editing
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const fileInputRef = useRef(null);
    
    // Log file input reference
    useEffect(() => {
        console.log('File input ref:', fileInputRef.current);
    }, []);
    const budgetEndDateInputRef = useRef(null);
    const firstInputRef = useRef(null);

    // Focus management for accessibility
    useEffect(() => {
        if (open && firstInputRef.current) {
            // Small delay to ensure modal is fully rendered
            const timer = setTimeout(() => {
                firstInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [open]);

    // Focus trap for modal
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                const focusableElements = document.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // Auto-calculate available amount when approved or utilized amount changes
    useEffect(() => {
        if (formData.amountApproved && formData.amountUtilized) {
            const approved = parseFloat(formData.amountApproved) || 0;
            const utilized = parseFloat(formData.amountUtilized) || 0;
            const available = approved - utilized;
            setFormData(prev => ({
                ...prev,
                amountAvailable: available >= 0 ? available.toFixed(2) : '0.00'
            }));
        } else if (formData.amountApproved) {
            const approved = parseFloat(formData.amountApproved) || 0;
            const utilized = parseFloat(formData.amountUtilized) || 0;
            const available = approved - utilized;
            setFormData(prev => ({
                ...prev,
                amountAvailable: available >= 0 ? available.toFixed(2) : '0.00'
            }));
        }
    }, [formData.amountApproved, formData.amountUtilized]);

    // Fetch existing documents when editing
    const fetchExistingDocuments = useCallback(async () => {
        if (!isEdit || !budgetLine?.budgetId) {
            console.log('fetchExistingDocuments: Not in edit mode or no budgetLine:', { isEdit, budgetId: budgetLine?.budgetId });
            return;
        }
        
        console.log('fetchExistingDocuments: Starting to fetch documents for budget ID:', budgetLine.budgetId);
        
        try {
            const token = sessionStorage.getItem('token');
            console.log('fetchExistingDocuments: Token available:', !!token);
            
            const response = await axios.get(
                `${API_BASE_URL}/api/budget-documents/budget/${budgetLine.budgetId}`,
                {
                    headers: { Authorization: token }
                }
            );
            
            console.log('fetchExistingDocuments: API response:', response.data);
            
            // Create document objects for display (without downloading actual files)
            const existingDocs = response.data || [];
            console.log('fetchExistingDocuments: Existing docs count:', existingDocs.length);
            
            const documentObjects = existingDocs.map(doc => {
                const docObj = {
                    name: doc.originalFileName,
                    size: doc.fileSize,
                    type: doc.contentType || 'application/octet-stream',
                    existingDocumentId: doc.documentId,
                    isExistingDocument: true,
                    description: doc.description,
                    uploadTimestamp: doc.uploadTimestamp
                };
                console.log('fetchExistingDocuments: Created document object:', docObj);
                return docObj;
            });
            
            console.log('fetchExistingDocuments: Setting documents state with:', documentObjects);
            setDocuments(documentObjects);
            // Deep copy to ensure originalDocuments is independent
            setOriginalDocuments(JSON.parse(JSON.stringify(documentObjects)));
            console.log('fetchExistingDocuments: Original documents stored, count:', documentObjects.length);
            console.log('fetchExistingDocuments: Documents state updated, count:', documentObjects.length);
            
        } catch (error) {
            console.error('fetchExistingDocuments: Error fetching existing documents:', error);
            console.error('fetchExistingDocuments: Error response:', error.response?.data);
            setSnackbar({
                open: true,
                message: 'Failed to load existing documents. You can still edit the budget line.',
                severity: 'warning'
            });
        }
    }, [isEdit, budgetLine?.budgetId]);

    const fetchDropdownData = useCallback(async () => {
        try {
            setLoadingEmployees(true);

            const tenantId = sessionStorage.getItem("tenantId");
            const token = sessionStorage.getItem("token");

            if (!tenantId || !token) {
                throw new Error("Missing tenant ID or token");
            }

            // Fetch Users
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/api/tenants/${tenantId}/users`,
                    {
                        headers: { Authorization: token }
                    }
                );

                if (!res.data || !Array.isArray(res.data)) {
                    throw new Error("Invalid API response structure");
                }

                // Transform employees data for dropdowns
                const employeeOptions = res.data.map(emp => ({
                    label: `${emp.name} ${emp.empCode ? `(${emp.empCode})` : ''}`.trim(),
                    value: emp.name,
                    empCode: emp.empCode
                }));

                setEmployees(employeeOptions);
                setSponsors(employeeOptions); // Use same data for sponsors
                console.log('Employees loaded:', employeeOptions.length);

            } catch (error) {
                console.error('Error fetching employees:', error);
                setSnackbar({
                    open: true,
                    message: `Failed to fetch employee data: ${error.message}`,
                    severity: 'error'
                });
                // Return a rejected promise to handle errors properly
                return Promise.reject(error);
            } finally {
                setLoadingEmployees(false);
            }
        } catch (error) {
            console.error('Error in fetchDropdownData:', error);
            setSnackbar({
                open: true,
                message: `Failed to fetch dropdown data: ${error.message}`,
                severity: 'error'
            });
            // Return a rejected promise to handle errors properly
            return Promise.reject(error);
        } finally {
            setLoadingEmployees(false);
        }
    }, []);

    // Initialize dropdown data when modal opens and auto-reset form
    useEffect(() => {
        console.log('useEffect: Modal state changed:', { open, isEdit, budgetId: budgetLine?.budgetId });
        
        if (open) {
            console.log('useEffect: Modal opened, fetching dropdown data first');
            // Always fetch dropdown data first, then handle form population
            fetchDropdownData().then(() => {
                if (isEdit && budgetLine) {
                    console.log('useEffect: In edit mode, populating form and fetching documents');
                    console.log('useEffect: Budget line data:', budgetLine);
                    
                    // Populate form with existing data for editing
                    setFormData({
                        budgetName: budgetLine.budgetName || '',
                        budgetDescription: budgetLine.budgetDescription || '',
                        budgetLineItem: budgetLine.budgetLineItem || '',
                        budgetEndDate: budgetLine.budgetEndDate || '',
                        budgetOwner: budgetLine.budgetOwner || '',
                        sponsor: budgetLine.sponsor || '',
                        lob: budgetLine.lob || '',
                        currency: budgetLine.currency || 'USD',
                        amountApproved: budgetLine.amountApproved || '',
                        amountUtilized: budgetLine.amountUtilized || '0',
                        amountAvailable: budgetLine.amountAvailable || '',
                        remarks: budgetLine.remarks || '',
                        lastUpdatedBy: sessionStorage.getItem('userName') || ''
                    });
                    
                    console.log('useEffect: Form data set, budgetOwner:', budgetLine.budgetOwner, 'sponsor:', budgetLine.sponsor);
                    
                    // Fetch existing documents for editing
                    console.log('useEffect: Calling fetchExistingDocuments');
                    fetchExistingDocuments();
                } else {
                    console.log('useEffect: Not in edit mode, resetting form');
                    handleReset();
                    setOriginalDocuments([]);
                }
            });
        } else {
            console.log('useEffect: Modal closed, resetting form');
            // Reset form when modal closes
            handleReset();
            setOriginalDocuments([]);
        }
    }, [open, isEdit, budgetLine, fetchExistingDocuments, fetchDropdownData]);

    const handleChange = (field) => (event) => {
        let value = event.target.value;
        
        // Special handling for numeric fields with precision validation
        if (['amountApproved', 'amountUtilized'].includes(field)) {
            // Allow only numbers and one decimal point
            value = value.replace(/[^0-9.]/g, '');
            // Prevent multiple decimals
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Validate BigDecimal precision (15,2) - max 13 digits before decimal, 2 after
            if (value.includes('.')) {
                const [integerPart, decimalPart] = value.split('.');
                if (integerPart.length > 13) {
                    value = integerPart.substring(0, 13) + '.' + decimalPart;
                }
                if (decimalPart.length > 2) {
                    value = integerPart + '.' + decimalPart.substring(0, 2);
                }
            } else if (value.length > 13) {
                value = value.substring(0, 13);
            }
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSelectChange = (field) => (selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [field]: selectedOption?.value || ''
        }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Helper function to get the proper value for CreatableSelect components
    const getCreatableSelectValue = (fieldValue, optionsArray) => {
        if (!fieldValue) return null;
        
        console.log(`getCreatableSelectValue: fieldValue="${fieldValue}", optionsArray length=${optionsArray.length}`);
        
        // First try to find an exact match in the options
        const exactMatch = optionsArray.find(option => option.value === fieldValue);
        if (exactMatch) {
            console.log(`getCreatableSelectValue: Found exact match:`, exactMatch);
            return exactMatch;
        }
        
        // If no exact match found, create a fallback object for manually entered values
        console.log(`getCreatableSelectValue: No exact match found, creating fallback for: "${fieldValue}"`);
        return { label: fieldValue, value: fieldValue };
    };

    // Handle file selection (both from input and drag & drop)
    const handleFileChange = (event) => {
        console.log('File change event:', event);
        const files = Array.from(event.target.files || event.dataTransfer?.files || []);
        console.log('Files array:', files);
        
        if (files.length === 0) {
            console.log('No files selected');
            return;
        }

        // Count existing documents (not File objects) and new files
        const existingDocCount = documents.filter(doc => doc.isExistingDocument).length;
        const newFileCount = documents.filter(doc => !doc.isExistingDocument).length;
        const totalCurrentCount = existingDocCount + newFileCount;

        // Check if adding these files would exceed the 4 document limit
        if (totalCurrentCount + files.length > 4) {
            setSnackbar({
                open: true,
                message: `Maximum 4 documents allowed. You have ${totalCurrentCount} documents and trying to add ${files.length} more. Please remove some documents first.`,
                severity: 'error'
            });
            return;
        }

        // Validate each file
        const validFiles = [];
        for (const file of files) {
            console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
                console.log('File size validation failed for:', file.name);
            setSnackbar({
                open: true,
                    message: `File ${file.name} exceeds 10MB limit. Please choose a smaller file.`,
                severity: 'error'
            });
                continue;
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif'
        ];

        if (!allowedTypes.includes(file.type)) {
                console.log('File type validation failed for:', file.name, 'Type:', file.type);
            setSnackbar({
                open: true,
                    message: `File ${file.name} has unsupported format. Please upload PDF, DOC, DOCX, XLS, XLSX, TXT, or image files.`,
                severity: 'error'
            });
                continue;
            }

            console.log('File validation passed for:', file.name);
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            console.log('Adding valid files to documents state:', validFiles);
            setDocuments(prev => {
                const newDocs = [...prev, ...validFiles];
                console.log('New documents state:', newDocs);
                return newDocs;
            });
        }

        // Reset file input
        if (fileInputRef.current) {
            console.log('Resetting file input');
            fileInputRef.current.value = '';
        }
    };

    const removeDocument = async (index) => {
        const documentToRemove = documents[index];
        
        // Just remove from local state - don't delete from server yet
        // Deletion will happen on form submit
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const removeAllDocuments = async () => {
        // Just clear local state - don't delete from server yet
        // Deletion will happen on form submit
        setDocuments([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateForm = () => {
        const newErrors = {};

        // Required field validations with length limits
        if (!formData.budgetName.trim()) {
            newErrors.budgetName = 'Budget name is required';
        } else if (formData.budgetName.length > 200) {
            newErrors.budgetName = 'Budget name cannot exceed 200 characters';
        }

        if (formData.budgetLineItem && formData.budgetLineItem.length > 100) {
            newErrors.budgetLineItem = 'Budget line item cannot exceed 100 characters';
        }

        if (formData.budgetOwner && formData.budgetOwner.length > 150) {
            newErrors.budgetOwner = 'Budget owner cannot exceed 150 characters';
        }

        if (!formData.amountApproved || parseFloat(formData.amountApproved) <= 0) {
            newErrors.amountApproved = 'Valid approved amount is required';
        }

        // Length validations for optional fields
        if (formData.budgetDescription && formData.budgetDescription.length > 500) {
            newErrors.budgetDescription = 'Budget description cannot exceed 500 characters';
        }

        if (formData.sponsor && formData.sponsor.length > 150) {
            newErrors.sponsor = 'Sponsor name cannot exceed 150 characters';
        }

        if (formData.lob && formData.lob.length > 50) {
            newErrors.lob = 'LOB cannot exceed 50 characters';
        }

        if (formData.currency && formData.currency.length > 50) {
            newErrors.currency = 'Currency code cannot exceed 50 characters';
        }

        if (formData.remarks && formData.remarks.length > 500) {
            newErrors.remarks = 'Remarks cannot exceed 500 characters';
        }

        // Validate that budget end date is in the future (only if provided)
        if (formData.budgetEndDate && new Date(formData.budgetEndDate) <= new Date()) {
            newErrors.budgetEndDate = 'Budget end date must be in the future';
        }

        // Validate that utilized amount doesn't exceed approved amount
        const approved = parseFloat(formData.amountApproved) || 0;
        const utilized = parseFloat(formData.amountUtilized) || 0;
        if (utilized > approved) {
            newErrors.amountUtilized = 'Utilized amount cannot exceed approved amount';
        }

        // Validate BigDecimal precision (15,2) constraints
        const validateBigDecimal = (value, fieldName) => {
            if (value) {
                const numValue = parseFloat(value);
                if (numValue >= 10000000000000) { // 13 digits max before decimal
                    newErrors[fieldName] = `${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()} exceeds maximum allowed value`;
                }
            }
        };

        validateBigDecimal(formData.amountApproved, 'amountApproved');
        validateBigDecimal(formData.amountUtilized, 'amountUtilized');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        console.log('Form submission started');
        console.log('Documents state at submission:', documents);
        
        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        setLoading(true);
        try {
            const budgetLineData = {
                budgetName: formData.budgetName,
                budgetDescription: formData.budgetDescription || "",
                budgetLineItem: formData.budgetLineItem,
                budgetEndDate: formData.budgetEndDate,
                budgetOwner: formData.budgetOwner,
                sponsor: formData.sponsor || "",
                lob: formData.lob || "",
                currency: formData.currency,
                amountApproved: parseFloat(formData.amountApproved),
                amountUtilized: parseFloat(formData.amountUtilized) || 0,
                amountAvailable: parseFloat(formData.amountAvailable) || 0,
                remarks: formData.remarks || "",
                lastUpdatedBy: formData.lastUpdatedBy || ""
            };

            let response;
            if (isEdit && budgetLine) {
                // Update existing budget line
                console.log('Updating budget line with data:', budgetLineData);
                response = await axios.put(
                    `${API_BASE_URL}/api/budget-lines/${budgetLine.budgetId}`,
                    budgetLineData,
                    {
                        headers: {
                            Authorization: sessionStorage.getItem("token"),
                            "Content-Type": "application/json"
                        }
                    }
                );
                console.log('Budget line update response:', response.data);
            } else {
                // Create new budget line
                console.log('Creating budget line with data:', budgetLineData);
                response = await axios.post(
                    `${API_BASE_URL}/api/budget-lines`,
                    budgetLineData,
                    {
                        headers: {
                            Authorization: sessionStorage.getItem("token"),
                            "Content-Type": "application/json"
                        }
                    }
                );
                console.log('Budget line creation response:', response.data);
            }

            // Handle documents for create/update
            if (isEdit) {
                // In edit mode, handle document deletions and uploads
                // IMPORTANT: Use the NEW budgetId from the response, not the old one
                const newBudgetId = response.data.budgetId;
                console.log('Edit mode: Using NEW budgetId for documents:', newBudgetId);
                console.log('Old budgetId was:', budgetLine.budgetId);
                
                // Only proceed with document deletion if we have originalDocuments
                // This prevents accidental deletion if originalDocuments wasn't set properly
                if (originalDocuments.length > 0) {
                    // Find documents that were removed (in original but not in current)
                    const currentExistingDocIds = documents
                        .filter(doc => doc.isExistingDocument && doc.existingDocumentId)
                        .map(doc => doc.existingDocumentId);
                    
                    const removedDocuments = originalDocuments.filter(
                        doc => doc.isExistingDocument && 
                        doc.existingDocumentId && 
                        !currentExistingDocIds.includes(doc.existingDocumentId)
                    );
                    
                    console.log('Document deletion check:', {
                        originalCount: originalDocuments.length,
                        currentCount: documents.length,
                        currentExistingCount: currentExistingDocIds.length,
                        removedCount: removedDocuments.length,
                        removedIds: removedDocuments.map(d => d.existingDocumentId)
                    });
                    
                    // Safety check: Don't delete if it seems like all documents would be deleted unexpectedly
                    // This prevents accidental mass deletion
                    if (removedDocuments.length === originalDocuments.length && originalDocuments.length > 0 && documents.length === 0) {
                        console.warn('Safety check: Preventing deletion of all documents. User may have accidentally cleared all documents.');
                        setSnackbar({
                            open: true,
                            message: 'Cannot delete all documents at once. Please keep at least one document or add new ones before removing existing ones.',
                            severity: 'warning'
                        });
                        // Don't proceed with deletion in this case
                    } else if (removedDocuments.length > 0) {
                        // Delete removed documents from server using NEW budgetId
                        try {
                            const token = sessionStorage.getItem('token');
                            const deletePromises = removedDocuments.map(doc => 
                                axios.delete(
                                    `${API_BASE_URL}/api/budget-documents/${doc.existingDocumentId}`,
                                    {
                                        headers: { Authorization: token }
                                    }
                                )
                            );
                            await Promise.all(deletePromises);
                            console.log('Removed documents deleted from server:', removedDocuments.length);
                        } catch (error) {
                            console.error('Error deleting removed documents:', error);
                            setSnackbar({
                                open: true,
                                message: 'Budget line updated but some documents failed to delete. Please try again.',
                                severity: 'warning'
                            });
                        }
                    }
                } else {
                    console.log('Warning: originalDocuments is empty, skipping document deletion to prevent accidental data loss');
                }
                
                // Upload new documents (not existing ones) using NEW budgetId
                const newDocuments = documents.filter(doc => !doc.isExistingDocument);
                if (newDocuments.length > 0) {
                    try {
                        for (const document of newDocuments) {
                            const formData = new FormData();
                            formData.append('file', document);
                            formData.append('description', document.name || '');

                            console.log('Uploading new document:', document.name, 'to NEW budgetId:', newBudgetId);
                            const uploadResponse = await axios.post(
                                `${API_BASE_URL}/api/budget-documents/upload/${newBudgetId}`,
                                formData,
                                {
                                    headers: {
                                        Authorization: sessionStorage.getItem("token"),
                                        "Content-Type": "multipart/form-data"
                                    }
                                }
                            );
                            console.log('Document upload response:', uploadResponse.data);
                        }
                        console.log('All new documents uploaded successfully');
                    } catch (uploadError) {
                        console.error('Error uploading documents:', uploadError);
                        setSnackbar({
                            open: true,
                            message: 'Budget line updated but some documents failed to upload. You can upload them later.',
                            severity: 'warning'
                        });
                    }
                }
            } else if (documents && documents.length > 0) {
                // Create mode - upload all documents
                const budgetId = response.data.budgetId;
                console.log('Documents to process:', documents.length);
                console.log('Budget ID for documents:', budgetId);
                
                try {
                    for (const document of documents) {
                        // Upload new documents
                        const formData = new FormData();
                        formData.append('file', document);
                        formData.append('description', document.name || '');

                        console.log('Uploading new document:', document.name);
                        const uploadResponse = await axios.post(
                            `${API_BASE_URL}/api/budget-documents/upload/${budgetId}`,
                            formData,
                            {
                                headers: {
                                    Authorization: sessionStorage.getItem("token"),
                                    "Content-Type": "multipart/form-data"
                                }
                            }
                        );
                        console.log('Document upload response:', uploadResponse.data);
                    }
                    console.log('All new documents uploaded successfully');
                } catch (uploadError) {
                    console.error('Error uploading documents:', uploadError);
                    setSnackbar({
                        open: true,
                        message: 'Budget line created but some documents failed to upload. You can upload them later.',
                        severity: 'warning'
                    });
                }
            } else {
                console.log('No documents to process');
            }

            console.log(`${isEdit ? 'Budget line updated' : 'Budget line created'} successfully:`, response.data);
            setSnackbar({
                open: true,
                message: isEdit ? "Budget Line Updated Successfully" : "Budget Line Created Successfully",
                severity: "success"
            });

            // Call parent's onSubmit if provided
            if (onSubmit) {
                onSubmit(response.data);
            }

            if (!isEdit) {
            handleReset();
            }
            onClose();

        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} budget line:`, error);

            let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} budget line. Please try again.`;
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error"
            });

        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            budgetName: '',
            budgetDescription: '',
            budgetLineItem: '',
            budgetEndDate: '',
            budgetOwner: '',
            sponsor: '',
            lob: '',
            currency: 'USD',
            amountApproved: '',
            amountUtilized: '0',
            amountAvailable: '',
            remarks: '',
            lastUpdatedBy: sessionStorage.getItem('userName') || ''
        });
        setErrors({});
        setDocuments([]);
        setOriginalDocuments([]); // Reset original documents
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getDisplayAvailable = () => {
        if (formData.amountAvailable) {
            const symbol = currencySymbols[formData.currency] || '$';
            return `${symbol}${parseFloat(formData.amountAvailable).toLocaleString()}`;
        }
        return `${currencySymbols[formData.currency] || '$'}0.00`;
    };

    const handleDateInputClick = () => {
        if (budgetEndDateInputRef.current) {
            budgetEndDateInputRef.current.showPicker();
        }
    };

    // Character count helper function
    const getCharacterCount = (value, maxLength) => {
        const currentLength = value ? value.length : 0;
        const isOverLimit = currentLength > maxLength;
        return (
            <div className={`text-right text-xs mt-1 ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {currentLength}/{maxLength} characters
            </div>
        );
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-2 sm:p-4 lg:p-6">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-green-600 text-white rounded-t-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 p-4 sm:p-6">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg lg:text-xl font-bold">{isEdit ? 'Edit Budget Line' : 'Create New Budget Line'}</h2>
                                {(() => {
                                    const existingDocCount = documents.filter(doc => doc.isExistingDocument).length;
                                    const newFileCount = documents.filter(doc => !doc.isExistingDocument).length;
                                    const totalCount = existingDocCount + newFileCount;
                                    return totalCount > 0 ? (
                                        <p className="text-green-100 text-xs sm:text-sm break-words overflow-wrap-anywhere">
                                            {totalCount} file{totalCount > 1 ? 's' : ''} attached
                                            {isEdit && existingDocCount > 0 && newFileCount > 0 && (
                                                <span className="ml-1">({existingDocCount} existing, {newFileCount} new)</span>
                                            )}
                                        </p>
                                    ) : null;
                                })()}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                    <div className="space-y-4 sm:space-y-6">
                        {/* 1st Line: Budget Name */}
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Budget Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter budget name"
                                    value={formData.budgetName}
                                    onChange={handleChange('budgetName')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.budgetName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    maxLength={200}
                                    ref={firstInputRef}
                                />
                                {getCharacterCount(formData.budgetName, 200)}
                                {errors.budgetName && <p className="text-red-500 text-xs mt-1">{errors.budgetName}</p>}
                            </div>
                        </div>

                        {/* 2nd Line: Budget Line Item and Budget End Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Budget Line Item
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter budget line item code"
                                    value={formData.budgetLineItem}
                                    onChange={handleChange('budgetLineItem')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.budgetLineItem ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    maxLength={100}
                                />
                                {getCharacterCount(formData.budgetLineItem, 100)}
                                {errors.budgetLineItem && <p className="text-red-500 text-xs mt-1">{errors.budgetLineItem}</p>}
                            </div>
                            <div className="sm:col-span-1 md:col-span-1 lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Budget End Date
                                </label>
                                <div
                                    onClick={handleDateInputClick}
                                    className={`relative w-full h-10 pl-10 pr-4 border rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer flex items-center ${
                                        errors.budgetEndDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none" size={16} />
                                    <input
                                        ref={budgetEndDateInputRef}
                                        type="date"
                                        value={formData.budgetEndDate}
                                        onChange={handleChange('budgetEndDate')}
                                        className="w-full bg-transparent outline-none cursor-pointer"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                {errors.budgetEndDate && <p className="text-red-500 text-xs mt-1">{errors.budgetEndDate}</p>}
                            </div>
                            <div className="sm:col-span-2 lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Budget Owner 
                                    {loadingEmployees && <span className="text-xs text-gray-500 ml-1">(Loading...)</span>}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-green-600 z-10" size={16} />
                                    <CreatableSelect
                                        options={employees}
                                        value={getCreatableSelectValue(formData.budgetOwner, employees)}
                                        onChange={handleSelectChange('budgetOwner')}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        placeholder={loadingEmployees ? "Loading..." : "Select budget owner"}
                                        isSearchable
                                        isClearable
                                        isLoading={loadingEmployees}
                                        isDisabled={loadingEmployees}
                                        formatCreateLabel={(inputValue) => inputValue.length <= 150 ? `Add "${inputValue}"` : `Name too long (max 150 chars)`}
                                        isValidNewOption={(inputValue) => inputValue.length <= 150}
                                        menuPosition="fixed"
                                        menuPlacement="auto"
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                height: '40px',
                                                paddingLeft: '28px',
                                                borderColor: errors.budgetOwner ? '#ef4444' : state.isFocused ? '#10b981' : '#d1d5db',
                                                boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                                            }),
                                            valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                                        }}
                                    />
                                </div>
                                {errors.budgetOwner && <p className="text-red-500 text-xs mt-1">{errors.budgetOwner}</p>}
                            </div>

                        </div>

                        {/* 3rd Line: Budget Owner, Sponsor, LOB */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sponsor 
                                    {loadingEmployees && <span className="text-xs text-gray-500 ml-1">(Loading...)</span>}
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 text-green-600 z-10" size={16} />
                                    <CreatableSelect
                                        options={sponsors}
                                        value={getCreatableSelectValue(formData.sponsor, sponsors)}
                                        onChange={handleSelectChange('sponsor')}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        placeholder={loadingEmployees ? "Loading..." : "Select sponsor"}
                                        isSearchable
                                        isClearable
                                        isLoading={loadingEmployees}
                                        isDisabled={loadingEmployees}
                                        formatCreateLabel={(inputValue) => inputValue.length <= 150 ? `Add "${inputValue}"` : `Name too long (max 150 chars)`}
                                        isValidNewOption={(inputValue) => inputValue.length <= 150}
                                        menuPosition="fixed"
                                        menuPlacement="auto"
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                height: '40px',
                                                paddingLeft: '28px',
                                                borderColor: errors.sponsor ? '#ef4444' : state.isFocused ? '#10b981' : '#d1d5db',
                                                boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                                            }),
                                            valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                                        }}
                                    />
                                </div>
                                {errors.sponsor && <p className="text-red-500 text-xs mt-1">{errors.sponsor}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Line of Business (LOB)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter LOB (optional)"
                                    value={formData.lob}
                                    onChange={handleChange('lob')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.lob ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    maxLength={50}
                                />
                                {getCharacterCount(formData.lob, 50)}
                                {errors.lob && <p className="text-red-500 text-xs mt-1">{errors.lob}</p>}
                            </div>
                        </div>

                        {/* 4th Line: Currency, Amount Approved, Amount Utilized */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency *
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={handleChange('currency')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.currency ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="JPY">JPY (¥)</option>
                                    <option value="CAD">CAD (C$)</option>
                                    <option value="AUD">AUD (A$)</option>
                                </select>
                                {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount Approved * 
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">
                                        {currencySymbols[formData.currency] || '$'}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        value={formData.amountApproved}
                                        onChange={handleChange('amountApproved')}
                                        className={`w-full h-10 pl-8 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                            errors.amountApproved ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    Max: {currencySymbols[formData.currency]}9,999,999,999,999.99
                                </div>
                                {errors.amountApproved && <p className="text-red-500 text-xs mt-1">{errors.amountApproved}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount Utilized 
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">
                                        {currencySymbols[formData.currency] || '$'}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        value={formData.amountUtilized}
                                        onChange={handleChange('amountUtilized')}
                                        className={`w-full h-10 pl-8 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                            errors.amountUtilized ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    Max: {currencySymbols[formData.currency]}9,999,999,999,999.99
                                </div>
                                {errors.amountUtilized && <p className="text-red-500 text-xs mt-1">{errors.amountUtilized}</p>}
                            </div>
                        </div>

                        {/* Amount Available Display */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <DollarSign className="text-green-600 mr-2" size={24} />
                                    <span className="text-lg font-semibold text-gray-900">Amount Available:</span>
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {getDisplayAvailable()}
                                </div>
                            </div>
                            {formData.amountApproved && (
                                <p className="text-sm text-gray-600 mt-2">
                                    {currencySymbols[formData.currency]}{formData.amountApproved} - {currencySymbols[formData.currency]}{formData.amountUtilized || '0'} = {getDisplayAvailable()}
                                </p>
                            )}
                        </div>

                        {/* Budget Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <MessageSquare className="mr-2 text-green-600" size={16} />
                                Budget Description
                            </label>
                            <textarea
                                placeholder="Enter budget description (optional)"
                                rows={3}
                                value={formData.budgetDescription}
                                onChange={handleChange('budgetDescription')}
                                className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap ${
                                    errors.budgetDescription ? 'border-red-500' : 'border-gray-300'
                                }`}
                                maxLength={500}
                            />
                            {getCharacterCount(formData.budgetDescription, 500)}
                            {errors.budgetDescription && <p className="text-red-500 text-xs mt-1">{errors.budgetDescription}</p>}
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <MessageSquare className="mr-2 text-green-600" size={16} />
                                Remarks
                            </label>
                            <textarea
                                placeholder="Additional notes or comments..."
                                rows={3}
                                value={formData.remarks}
                                onChange={handleChange('remarks')}
                                className={`w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap ${
                                    errors.remarks ? 'border-red-500' : 'border-gray-300'
                                }`}
                                maxLength={500}
                            />
                            {getCharacterCount(formData.remarks, 500)}
                            {errors.remarks && <p className="text-red-500 text-xs mt-1">{errors.remarks}</p>}
                        </div>

                        {/* Documents Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                                <Paperclip className="mr-2 text-green-600" size={16} />
                                Documents (Optional - Max 4 files)
                            </label>

                            {/* File Input */}
                            <div className="mb-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                                    onFocus={() => console.log('File input focused')}
                                    onBlur={() => console.log('File input blurred')}
                                    onClick={() => console.log('File input clicked directly')}
                                />
                                
                                {/* Drag & Drop Zone */}
                                <div
                                    className={`w-full px-4 py-8 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center justify-center space-y-2 ${
                                        (() => {
                                            const existingDocCount = documents.filter(doc => doc.isExistingDocument).length;
                                            const newFileCount = documents.filter(doc => !doc.isExistingDocument).length;
                                            return existingDocCount + newFileCount >= 4;
                                        })()
                                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                                            : 'border-gray-300 hover:border-green-500 hover:bg-green-50 cursor-pointer'
                                    }`}
                                    onClick={() => {
                                        const existingDocCount = documents.filter(doc => doc.isExistingDocument).length;
                                        const newFileCount = documents.filter(doc => !doc.isExistingDocument).length;
                                        const totalCount = existingDocCount + newFileCount;
                                        
                                        console.log('File input clicked, total documents:', totalCount);
                                        console.log('File input ref:', fileInputRef.current);
                                        if (totalCount < 4) {
                                            console.log('Triggering file input click');
                                            if (fileInputRef.current) {
                                                fileInputRef.current.click();
                                            } else {
                                                console.error('File input ref is null');
                                            }
                                        } else {
                                            console.log('Maximum files reached');
                                        }
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        console.log('Drag over event');
                                        const existingDocCount = documents.filter(doc => doc.isExistingDocument).length;
                                        const newFileCount = documents.filter(doc => !doc.isExistingDocument).length;
                                        if (existingDocCount + newFileCount < 4) {
                                            e.currentTarget.classList.add('border-green-500', 'bg-green-50');
                                        }
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        console.log('Drag leave event');
                                        e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        console.log('Drop event, files:', e.dataTransfer.files);
                                        // Remove drag styling
                                        e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                                        
                                        const files = Array.from(e.dataTransfer.files);
                                        console.log('Files from drop:', files);
                                        handleFileChange({ target: { files } });
                                    }}
                                >
                                    <Paperclip size={24} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-600">
                                        {(() => {
                                            const existingDocCount = documents.filter(doc => doc.isExistingDocument).length;
                                            const newFileCount = documents.filter(doc => !doc.isExistingDocument).length;
                                            const totalCount = existingDocCount + newFileCount;
                                            return totalCount >= 4 ? 'Maximum files reached' : 'Drop files here or click to browse';
                                        })()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {(() => {
                                            const existingDocCount = documents.filter(doc => doc.isExistingDocument).length;
                                            const newFileCount = documents.filter(doc => !doc.isExistingDocument).length;
                                            const totalCount = existingDocCount + newFileCount;
                                            return `${totalCount}/4 files selected`;
                                        })()}
                                    </span>
                                </div>
                                
                                <p className="text-xs text-gray-500 mt-2">
                                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT (Max 10MB each)
                                </p>
                            </div>

                            {/* Selected Files Display */}
                            {documents.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                            <File className="mr-1" size={16} />
                                            Selected Files ({documents.length})
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={removeAllDocuments}
                                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                                        >
                                            Remove All
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {documents.map((doc, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white rounded-md p-3 border border-gray-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <File size={16} className={doc.isExistingDocument ? "text-blue-600" : "text-green-600"} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900 truncate" title={doc.name}>
                                                            {doc.name}
                                                </p>
                                                        <div className="flex items-center space-x-2">
                                                <p className="text-xs text-gray-500">
                                                                {formatFileSize(doc.size)}
                                                            </p>
                                                            {doc.isExistingDocument && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                                    Existing
                                                                </span>
                                                            )}
                                                        </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                                    onClick={() => removeDocument(index)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title={doc.isExistingDocument ? "Delete document" : "Remove file"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                        ))}
                                </div>
                                </div>
                            ) : isEdit ? (
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
                                    <p className="text-sm text-gray-500">
                                        {isEdit ? 'No existing documents found for this budget line.' : 'No documents selected.'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        You can add new documents using the upload area above.
                                    </p>
                                </div>
                            ) : null}

                            {/* Files Indicator */}
                            {documents.length > 0 && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-700">
                                        {isEdit ? (
                                            <>
                                                ✓ {documents.length} file{documents.length !== 1 ? 's' : ''} ready
                                                {(() => {
                                                    const existingCount = documents.filter(doc => doc.isExistingDocument).length;
                                                    const newCount = documents.filter(doc => !doc.isExistingDocument).length;
                                                    if (existingCount > 0 && newCount > 0) {
                                                        return ` (${existingCount} existing, ${newCount} new)`;
                                                    } else if (existingCount > 0) {
                                                        return ` (${existingCount} existing)`;
                                                    } else if (newCount > 0) {
                                                        return ` (${newCount} new)`;
                                                    }
                                                    return '';
                                                })()}
                                            </>
                                        ) : (
                                            `✓ ${documents.length} file${documents.length !== 1 ? 's' : ''} ready to upload`
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-lg font-medium text-gray-900">{isEdit ? 'Updating Budget Line...' : 'Creating Budget Line...'}</p>
                            <p className="text-sm text-gray-600">
                                {documents.length > 0
                                    ? (() => {
                                        const newCount = documents.filter(doc => !doc.isExistingDocument).length;
                                        if (isEdit && newCount > 0) {
                                            return `Updating budget line and uploading ${newCount} new document${newCount !== 1 ? 's' : ''}...`;
                                        } else if (isEdit) {
                                            return 'Updating budget line...';
                                        } else {
                                            return `Creating budget line and uploading ${documents.length} document${documents.length !== 1 ? 's' : ''}...`;
                                        }
                                    })()
                                    : `Please wait while we ${isEdit ? 'update' : 'create'} your budget line`
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {(() => {
                                    const newCount = documents.filter(doc => !doc.isExistingDocument).length;
                                    if (isEdit && newCount > 0) {
                                        return 'Updating & Uploading...';
                                    } else if (isEdit) {
                                        return 'Updating...';
                                    } else if (documents.length > 0) {
                                        return 'Creating & Uploading...';
                                    } else {
                                        return 'Creating...';
                                    }
                                })()}
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2" size={16} />
                                {isEdit ? 'Update Budget Line' : 'Create Budget Line'}
                                {(() => {
                                    const newCount = documents.filter(doc => !doc.isExistingDocument).length;
                                    if (isEdit && newCount > 0) {
                                        return (
                                    <span className="ml-1 bg-green-600 text-green-200 text-xs px-1.5 py-0.5 rounded-full">
                                        +📎
                                    </span>
                                        );
                                    } else if (!isEdit && documents.length > 0) {
                                        return (
                                            <span className="ml-1 bg-green-600 text-green-200 text-xs px-1.5 py-0.5 rounded-full">
                                                +📎
                                            </span>
                                        );
                                    }
                                    return null;
                                })()}
                            </>
                        )}
                    </button>
                </div>
            </div>
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
};

export default AddBudgetLineModal;