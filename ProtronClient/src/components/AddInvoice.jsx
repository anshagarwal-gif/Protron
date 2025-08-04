import React, { useState, useRef, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';
import {
    X,
    Calendar,
    User,
    Building,
    DollarSign,
    FileText,
    Download,
    Plus,
    CreditCard,
    Clock,
    MessageSquare,
    Paperclip,
    Trash2
} from 'lucide-react';

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

const AddInvoiceModal = ({ 
    open, 
    onClose, 
    onSubmit, 
    timesheetData, 
    viewMode, 
    currentWeekStart, 
    currentMonthRange, 
    employee 
}) => {
    const [formData, setFormData] = useState({
        invoiceName: '',
        customerName: '',
        customerAddress: '',
        supplierName: sessionStorage.getItem('tenantName') || '',
        supplierAddress: '',
        employeeName: '',
        rate: '',
        currency: 'USD',
        fromDate: '',
        toDate: '',
        hoursSpent: '',
        totalAmount: '',
        remarks: ''
    });

    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [supplierAddresses, setSupplierAddresses] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    
    // Single attachment field that handles multiple files (up to 4)
    const [attachments, setAttachments] = useState([]);
    const [attachTimesheet, setAttachTimesheet] = useState(false);
    
    const fromDateInputRef = useRef(null);
    const toDateInputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Helper functions for timesheet data processing
    const formatDate = (date) =>
        date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
    
    const formatDateKey = (date) => date.toISOString().split("T")[0];
    
    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const getWeekDates = (startDate) => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const getMonthDates = () => {
        const dates = [];
        const current = new Date(currentMonthRange.start);
        while (current <= currentMonthRange.end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const getCurrentDates = () => (viewMode === "Weekly" ? getWeekDates(currentWeekStart) : getMonthDates());

    const getTimeEntries = (date) => {
        const dateKey = formatDateKey(date);
        return timesheetData[dateKey] || [];
    };

    const getDayTotalTime = (date) => {
        const entries = getTimeEntries(date);
        let totalMinutes = entries.reduce((total, entry) => {
            return total + (entry.hours || 0) * 60 + (entry.minutes || 0);
        }, 0);

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return { hours, minutes };
    };

    const prepareTimesheetData = () => {
        if (!attachTimesheet || !timesheetData) return null;

        const dates = getCurrentDates();
        const timesheetEntries = [];
        let totalHours = 0;
        let totalMinutes = 0;

        dates.forEach((date) => {
            const entries = getTimeEntries(date);
            const dayTotal = getDayTotalTime(date);
            
            totalHours += dayTotal.hours;
            totalMinutes += dayTotal.minutes;

            entries.forEach((entry) => {
                timesheetEntries.push({
                    date: formatDate(date),
                    dayOfWeek: date.toLocaleDateString("en-GB", { weekday: "short" }),
                    isWeekend: isWeekend(date),
                    taskType: entry.task || entry.fullTask?.taskType || '',
                    taskTopic: entry.fullTask?.taskTopic || '',
                    hours: entry.hours || 0,
                    minutes: entry.minutes || 0,
                    description: entry.description || '',
                    project: entry.project?.projectName || '',
                    submitted: entry.submitted || false
                });
            });

            // Add empty row for days with no entries (useful for weekly view)
            if (entries.length === 0 && viewMode === "Weekly") {
                timesheetEntries.push({
                    date: formatDate(date),
                    dayOfWeek: date.toLocaleDateString("en-GB", { weekday: "short" }),
                    isWeekend: isWeekend(date),
                    taskType: '',
                    taskTopic: '',
                    hours: 0,
                    minutes: 0,
                    description: 'No tasks logged',
                    project: '',
                    submitted: false
                });
            }
        });

        // Handle overflow minutes
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;

        return {
            viewMode,
            period: viewMode === "Weekly" 
                ? `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`
                : `${formatDate(currentMonthRange.start)} - ${formatDate(currentMonthRange.end)}`,
            employeeName: employee?.name || formData.employeeName,
            employeeEmail: employee?.email || '',
            entries: timesheetEntries,
            totalHours,
            totalMinutes,
            targetHours: viewMode === "Weekly" ? 40 : 184
        };
    };

    // Auto-populate employee fields if coming from timesheet
    useEffect(() => {
        if (employee && open) {
            setFormData(prev => ({
                ...prev,
                employeeName: employee.name || '',
                rate: employee.rawData?.cost || '',
                currency: employee.rawData?.unit || employee.rawData?.currency || 'USD'
            }));
        }
    }, [employee, open]);

    // Auto-set date range based on timesheet view
    useEffect(() => {
        if (open && timesheetData && viewMode && (currentWeekStart || currentMonthRange)) {
            const dates = getCurrentDates();
            if (dates.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    fromDate: dates[0].toISOString().split('T')[0],
                    toDate: dates[dates.length - 1].toISOString().split('T')[0]
                }));
            }
        }
    }, [open, viewMode, currentWeekStart, currentMonthRange]);

    // Auto-calculate hours from timesheet data
    useEffect(() => {
        if (attachTimesheet && timesheetData && viewMode && (currentWeekStart || currentMonthRange)) {
            const dates = getCurrentDates();
            let totalMinutes = 0;

            dates.forEach((date) => {
                const { hours, minutes } = getDayTotalTime(date);
                totalMinutes += hours * 60 + minutes;
            });

            const totalHours = Math.floor(totalMinutes / 60);
            const remainingMinutes = totalMinutes % 60;

            setFormData(prev => ({
                ...prev,
                hoursSpent: totalHours.toString()
            }));
        }
    }, [attachTimesheet, timesheetData]);

    // Generate preview invoice ID for display
    const generatePreviewInvoiceId = () => {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();
        return `INV-${month}${day}${year}-100001`;
    };

    const getAttachedFilesCount = () => {
        return attachments.filter(file => file !== null).length;
    };

    const getTotalFileSize = () => {
        return attachments.reduce((total, file) => total + file.size, 0);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Initialize dropdown data when modal opens
    useEffect(() => {
        if (open) {
            fetchDropdownData();
        }
    }, [open]);

   const fetchDropdownData = async () => {
    try {
        setLoadingEmployees(true);
        
        const tenantId = sessionStorage.getItem("tenantId");
        const token = sessionStorage.getItem("token");
        
        if (!tenantId || !token) {
            throw new Error('Missing tenantId or token');
        }

        const res = await axios.get(
            `${API_BASE_URL}/api/tenants/${tenantId}/users`,
            {
                headers: { Authorization: token }
            }
        );

        if (!res.data || !Array.isArray(res.data)) {
            throw new Error('Invalid API response structure');
        }

        // Transform employees data for dropdowns
        const employeeOptions = res.data.map(emp => ({
            label: `${emp.name} ${emp.empCode ? `(${emp.empCode})` : ''}`.trim(),
            value: emp.name,
            empCode: emp.empCode,
            cost: emp.cost,
            email: emp.email,
            userId: emp.userId,
            status: emp.status,
            currency: emp.unit || emp.currency || emp.preferredunit || 'USD',
            city: emp.city,
            state: emp.state,
            country: emp.country,
            mobilePhone: emp.mobilePhone
        }));

        // Enhanced customer options with address info
        const customerOptionsWithAddress = res.data.map(emp => ({
            label: `${emp.name} ${emp.empCode ? `(${emp.empCode})` : ''}`.trim(),
            value: emp.name,
            empCode: emp.empCode,
            cost: emp.cost,
            email: emp.email,
            userId: emp.userId,
            status: emp.status,
            address: (() => {
                const addressParts = [];
                if (emp.city) addressParts.push(emp.city);
                if (emp.state) addressParts.push(emp.state);
                if (emp.country) addressParts.push(emp.country);
                
                if (addressParts.length > 0) {
                    return addressParts.join(', ');
                } else {
                    return `Address for ${emp.name}`;
                }
            })(),
            city: emp.city,
            state: emp.state,
            country: emp.country,
            mobilePhone: emp.mobilePhone,
            currency: emp.unit || emp.currency || 'USD'
        }));

        setEmployees(employeeOptions);
        setCustomers(customerOptionsWithAddress);
        setSuppliers([]);
        setCustomerAddresses([]);
        setSupplierAddresses([]);

    } catch (error) {
        console.error('Error fetching dropdown data:', error);
        setEmployees([]);
        setCustomers([]);
        setSuppliers([]);
        setCustomerAddresses([]);
        setSupplierAddresses([]);
        alert(`Failed to fetch employee data: ${error.message}`);
    } finally {
        setLoadingEmployees(false);
    }
};

    // Auto-calculate total amount when rate or hours change
    useEffect(() => {
        if (formData.rate && formData.hoursSpent) {
            setIsCalculating(true);
            const rate = parseFloat(formData.rate) || 0;
            const hours = parseInt(formData.hoursSpent) || 0;
            const total = rate * hours;
            setFormData(prev => ({
                ...prev,
                totalAmount: total.toFixed(2)
            }));
            setTimeout(() => setIsCalculating(false), 300);
        } else {
            setFormData(prev => ({
                ...prev,
                totalAmount: ''
            }));
        }
    }, [formData.rate, formData.hoursSpent]);

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
        // Clear error when user starts typing
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

    // Special handler for customer selection to auto-populate address
    const handleCustomerChange = (selectedOption) => {
        if (selectedOption) {
            let addressParts = [];
            if (selectedOption.city) addressParts.push(selectedOption.city);
            if (selectedOption.state) addressParts.push(selectedOption.state);
            if (selectedOption.country) addressParts.push(selectedOption.country);
            
            let finalAddress = '';
            if (addressParts.length > 0) {
                finalAddress = addressParts.join(', ');
            } else {
                finalAddress = `${selectedOption.value}'s Address`;
            }
            
            setFormData(prev => ({
                ...prev,
                customerName: selectedOption.value,
                customerAddress: finalAddress
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                customerName: '',
                customerAddress: ''
            }));
        }
        
        if (errors.customerName) {
            setErrors(prev => ({ ...prev, customerName: '' }));
        }
    };

    // Special handler for employee selection to auto-populate rate and currency
   const handleEmployeeChange = (selectedOption) => {
    if (selectedOption) {
        const newCurrency = selectedOption.currency || 'USD';
        const newRate = selectedOption.cost || '';
        
        console.log('Selected employee:', selectedOption);
        console.log('Currency from employee:', newCurrency);
        
        setFormData(prev => ({
            ...prev,
            employeeName: selectedOption.value,
            rate: newRate,
            currency: newCurrency
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            employeeName: '',
            rate: '',
            currency: 'USD'
        }));
    }
    
    if (errors.employeeName) {
        setErrors(prev => ({ ...prev, employeeName: '' }));
    }
    if (errors.rate) {
        setErrors(prev => ({ ...prev, rate: '' }));
    }
};

    // Handle multiple file selection (up to 4 files)
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        
        if (files.length > 4) {
            alert('You can attach a maximum of 4 files at once.');
            return;
        }

        // Validate each file
        const validFiles = [];
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif'
        ];

        for (let file of files) {
            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert(`File "${file.name}" exceeds 10MB limit and will be skipped.`);
                continue;
            }

            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                alert(`File "${file.name}" has unsupported format and will be skipped. Please upload PDF, DOC, DOCX, TXT, or image files.`);
                continue;
            }

            validFiles.push(file);
        }

        setAttachments(validFiles);
    };

    const removeAttachment = (index) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const removeAllAttachments = () => {
        setAttachments([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.invoiceName.trim()) newErrors.invoiceName = 'Invoice name is required';
        if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
        if (!formData.supplierName.trim()) newErrors.supplierName = 'Supplier name is required';
        if (!formData.employeeName.trim()) newErrors.employeeName = 'Employee name is required';
        if (!formData.rate || parseFloat(formData.rate) <= 0) newErrors.rate = 'Valid rate is required';
        if (!formData.fromDate) newErrors.fromDate = 'From date is required';
        if (!formData.toDate) newErrors.toDate = 'To date is required';
        if (!formData.hoursSpent || parseInt(formData.hoursSpent) <= 0) newErrors.hoursSpent = 'Valid hours are required';
        
        if (formData.fromDate && formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate)) {
            newErrors.toDate = 'To date must be after from date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const invoiceData = {
                invoiceName: formData.invoiceName,
                customerName: formData.customerName,
                customerAddress: formData.customerAddress || "",
                supplierName: formData.supplierName,
                supplierAddress: formData.supplierAddress || "",
                employeeName: formData.employeeName,
                rate: parseFloat(formData.rate),
                currency: formData.currency,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                hoursSpent: parseInt(formData.hoursSpent),
                totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
                remarks: formData.remarks || "",
                // Include timesheet data if checkbox is checked
                timesheetData: attachTimesheet ? prepareTimesheetData() : null
            };

            let response;
            if (attachments.length > 0) {
                // Create FormData for multipart request
                const formDataToSend = new FormData();
                formDataToSend.append('invoice', JSON.stringify(invoiceData));
                
                // Add attachments to FormData
                attachments.forEach((file) => {
                    formDataToSend.append('attachments', file);
                });

                response = await axios.post(
                    `${API_BASE_URL}/api/invoices/generate-with-attachments`,
                    formDataToSend,
                    {
                        headers: {
                            Authorization: sessionStorage.getItem("token"),
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );
            } else {
                // Regular JSON request without attachments
                response = await axios.post(
                    `${API_BASE_URL}/api/invoices/generate`,
                    invoiceData,
                    {
                        headers: {
                            Authorization: sessionStorage.getItem("token"),
                            "Content-Type": "application/json"
                        }
                    }
                );
            }

            console.log('Invoice generated successfully:', response.data);
            
            // Call parent's onSubmit if provided
            if (onSubmit) {
                onSubmit(response.data);
            }
            
            // Ask user if they want to download the PDF
            if (response.data.invoiceId) {
                setTimeout(() => {
                    if (confirm("Invoice generated successfully! Would you like to download the PDF?")) {
                        handleDownloadInvoice(response.data.invoiceId, response.data.invoiceName);
                    }
                }, 500);
            }
            
            handleReset();
            onClose();
            
        } catch (error) {
            console.error('Error creating invoice:', error);
            
            let errorMessage = 'Failed to create invoice. Please try again.';
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (invoiceId, invoiceName) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/invoices/download/${invoiceId}`,
                {
                    headers: {
                        Authorization: sessionStorage.getItem("token")
                    },
                    responseType: 'blob'
                }
            );

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${invoiceName || invoiceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error("Failed to download invoice:", error);
            alert("Failed to download invoice PDF");
        }
    };

    const handleReset = () => {
        setFormData({
            invoiceName: '',
            customerName: '',
            customerAddress: '',
            supplierName: sessionStorage.getItem('tenantName') || '',
            supplierAddress: '',
            employeeName: '',
            rate: '',
            currency: 'USD',
            fromDate: '',
            toDate: '',
            hoursSpent: '',
            totalAmount: '',
            remarks: ''
        });
        setErrors({});
        setAttachments([]);
        setAttachTimesheet(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getDisplayTotal = () => {
        if (isCalculating) return 'Calculating...';
        if (formData.totalAmount) {
            const symbol = currencySymbols[formData.currency] || '$';
            return `${symbol}${parseFloat(formData.totalAmount).toLocaleString()}`;
        }
        return `${currencySymbols[formData.currency] || '$'}0.00`;
    };

    const getTimesheetSummary = () => {
        if (!attachTimesheet || !timesheetData || !viewMode || (!currentWeekStart && !currentMonthRange)) return null;

        const dates = getCurrentDates();
        let totalHours = 0;
        let totalMinutes = 0;
        let taskCount = 0;

        dates.forEach((date) => {
            const { hours, minutes } = getDayTotalTime(date);
            const entries = getTimeEntries(date);
            totalHours += hours;
            totalMinutes += minutes;
            taskCount += entries.length;
        });

        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;

        return {
            period: viewMode,
            totalHours,
            totalMinutes,
            taskCount,
            dateRange: `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`
        };
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-green-900 flex items-center">
                        <FileText className="mr-2" size={24} />
                        Generate New Invoice
                        {getAttachedFilesCount() > 0 && (
                            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {getAttachedFilesCount()} file{getAttachedFilesCount() > 1 ? 's' : ''} attached
                            </span>
                        )}
                        {attachTimesheet && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Timesheet Included
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="space-y-6">
                        {/* 1st Line: Invoice ID and Invoice Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Invoice ID *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Auto-generated"
                                    value={generatePreviewInvoiceId()}
                                    disabled
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Format: INV-MMDDYYYY-XXXXXX (Auto-generated)
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Invoice Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter invoice name"
                                    value={formData.invoiceName}
                                    onChange={handleChange('invoiceName')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.invoiceName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    maxLength={100}
                                />
                                {errors.invoiceName && <p className="text-red-500 text-xs mt-1">{errors.invoiceName}</p>}
                            </div>
                        </div>

                        {/* 2nd Line: Customer Name, Customer Address, Supplier Name, Supplier Address */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer Name *
                                    {loadingEmployees && <span className="text-xs text-gray-500 ml-1">(Loading...)</span>}
                                </label>
                                <CreatableSelect
                                    options={customers}
                                    value={formData.customerName ? customers.find(cust => cust.value === formData.customerName) : null}
                                    onChange={handleCustomerChange}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    placeholder={loadingEmployees ? "Loading..." : "Select customer"}
                                    isSearchable
                                    isClearable
                                    isLoading={loadingEmployees}
                                    isDisabled={loadingEmployees}
                                    formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            height: '40px',
                                            borderColor: errors.customerName ? '#ef4444' : state.isFocused ? '#10b981' : '#d1d5db',
                                            boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                                        }),
                                        valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                                    }}
                                />
                                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer Address
                                    <span className="text-xs text-gray-500 ml-1">(Auto-filled)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Customer address"
                                    value={formData.customerAddress}
                                    onChange={handleChange('customerAddress')}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Supplier Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter supplier name"
                                    value={formData.supplierName}
                                    onChange={handleChange('supplierName')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.supplierName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.supplierName && <p className="text-red-500 text-xs mt-1">{errors.supplierName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Supplier Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter supplier address"
                                    value={formData.supplierAddress}
                                    onChange={handleChange('supplierAddress')}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>

                        {/* 3rd Line: Employee Name, Currency, Rate, Hours Spent */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employee Name *
                                    {loadingEmployees && <span className="text-xs text-gray-500 ml-1">(Loading...)</span>}
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-green-600 z-10" size={16} />
                                    <CreatableSelect
                                        options={employees}
                                        value={formData.employeeName ? employees.find(emp => emp.value === formData.employeeName) : null}
                                        onChange={handleEmployeeChange}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        placeholder={loadingEmployees ? "Loading..." : "Select employee"}
                                        isSearchable
                                        isClearable
                                        isLoading={loadingEmployees}
                                        isDisabled={loadingEmployees}
                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                height: '40px',
                                                paddingLeft: '28px',
                                                borderColor: errors.employeeName ? '#ef4444' : state.isFocused ? '#10b981' : '#d1d5db',
                                                boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
                                            }),
                                            valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                                        }}
                                    />
                                </div>
                                {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency * 
                                    <span className="text-xs text-gray-500 ml-1">(Auto-filled)</span>
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={handleChange('currency')}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="JPY">JPY (¥)</option>
                                    <option value="CAD">CAD (C$)</option>
                                    <option value="AUD">AUD (A$)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate * 
                                    <span className="text-xs text-gray-500 ml-1">(Auto-filled)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">
                                        {currencySymbols[formData.currency] || '$'}
                                    
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.rate}
                                        onChange={handleChange('rate')}
                                        className={`w-full h-10 pl-8 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                            errors.rate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        step="0.01"
                                        min="0.01"
                                    />
                                </div>
                                {errors.rate && <p className="text-red-500 text-xs mt-1">{errors.rate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hours Spent *
                                    {attachTimesheet && <span className="text-xs text-blue-500 ml-1">(From timesheet)</span>}
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.hoursSpent}
                                    onChange={handleChange('hoursSpent')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.hoursSpent ? 'border-red-500' : 'border-gray-300'
                                    } ${attachTimesheet ? 'bg-blue-50' : ''}`}
                                    min="1"
                                    readOnly={attachTimesheet}
                                />
                                {errors.hoursSpent && <p className="text-red-500 text-xs mt-1">{errors.hoursSpent}</p>}
                            </div>
                        </div>

                        {/* 4th Line: From Date and To Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    From Date *
                                    {attachTimesheet && <span className="text-xs text-blue-500 ml-1">(From timesheet)</span>}
                                </label>
                                <div
                                    onClick={() => !attachTimesheet && fromDateInputRef.current?.showPicker?.()}
                                    className={`relative w-full h-10 pl-10 pr-4 border rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer flex items-center ${
                                        errors.fromDate ? 'border-red-500' : 'border-gray-300'
                                    } ${attachTimesheet ? 'bg-blue-50 cursor-not-allowed' : ''}`}
                                >
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none" size={16} />
                                    <input
                                        ref={fromDateInputRef}
                                        type="date"
                                        value={formData.fromDate}
                                        onChange={handleChange('fromDate')}
                                        className="w-full bg-transparent outline-none cursor-pointer"
                                        readOnly={attachTimesheet}
                                    />
                                </div>
                                {errors.fromDate && <p className="text-red-500 text-xs mt-1">{errors.fromDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To Date *
                                    {attachTimesheet && <span className="text-xs text-blue-500 ml-1">(From timesheet)</span>}
                                </label>
                                <div
                                    onClick={() => !attachTimesheet && toDateInputRef.current?.showPicker?.()}
                                    className={`relative w-full h-10 pl-10 pr-4 border rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 cursor-pointer flex items-center ${
                                        errors.toDate ? 'border-red-500' : 'border-gray-300'
                                    } ${attachTimesheet ? 'bg-blue-50 cursor-not-allowed' : ''}`}
                                >
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none" size={16} />
                                    <input
                                        ref={toDateInputRef}
                                        type="date"
                                        value={formData.toDate}
                                        onChange={handleChange('toDate')}
                                        className="w-full bg-transparent outline-none cursor-pointer"
                                        min={formData.fromDate}
                                        readOnly={attachTimesheet}
                                    />
                                </div>
                                {errors.toDate && <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>}
                            </div>

                            {/* Empty divs to maintain grid alignment */}
                            <div></div>
                            <div></div>
                        </div>

                        {/* Timesheet Summary (when timesheet is attached) */}
                        {attachTimesheet && getTimesheetSummary() && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-blue-900 flex items-center">
                                        <Clock className="mr-2" size={16} />
                                        Timesheet Summary ({getTimesheetSummary().period} View)
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-blue-600 font-medium">Period:</span>
                                        <p className="text-blue-800">{getTimesheetSummary().dateRange}</p>
                                    </div>
                                    <div>
                                        <span className="text-blue-600 font-medium">Total Hours:</span>
                                        <p className="text-blue-800">{getTimesheetSummary().totalHours}h {getTimesheetSummary().totalMinutes}m</p>
                                    </div>
                                    <div>
                                        <span className="text-blue-600 font-medium">Tasks Logged:</span>
                                        <p className="text-blue-800">{getTimesheetSummary().taskCount} tasks</p>
                                    </div>
                                    <div>
                                        <span className="text-blue-600 font-medium">Employee:</span>
                                        <p className="text-blue-800">{employee?.name || formData.employeeName}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600 mt-2">
                                    ✓ Detailed timesheet table will be included in the generated PDF
                                </p>
                            </div>
                        )}

                        {/* Total Amount Display */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <DollarSign className="text-green-600 mr-2" size={24} />
                                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                                </div>
                                <div className={`text-2xl font-bold ${isCalculating ? 'text-orange-600' : 'text-green-600'}`}>
                                    {getDisplayTotal()}
                                </div>
                            </div>
                            {formData.rate && formData.hoursSpent && (
                                <p className="text-sm text-gray-600 mt-2">
                                    {currencySymbols[formData.currency]}{formData.rate} × {formData.hoursSpent} hours = {getDisplayTotal()}
                                </p>
                            )}
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                maxLength={500}
                            />
                            <div className="text-right text-sm text-gray-500 mt-1">
                                {formData.remarks.length}/500 characters
                            </div>
                        </div>

                        {/* Single Attachments Field - Multiple File Selection (Max 4) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                                <Paperclip className="mr-2 text-green-600" size={16} />
                                Attachments (Optional - Max 4 files)
                            </label>
                            
                            {/* File Input */}
                            <div className="mb-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                                    multiple
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-green-600"
                                    disabled={attachments.length >= 4}
                                >
                                    <Paperclip size={20} />
                                    <span className="text-sm font-medium">
                                        {attachments.length === 0 
                                            ? 'Choose Files (Max 4)' 
                                            : attachments.length >= 4 
                                                ? 'Maximum 4 files reached' 
                                                : `Add More Files (${4 - attachments.length} remaining)`
                                        }
                                    </span>
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Max 10MB each)
                                </p>
                            </div>

                            {/* Selected Files Display */}
                            {attachments.length > 0 && (
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                            <FileText className="mr-1" size={16} />
                                            Selected Files ({attachments.length}/4)
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={removeAllAttachments}
                                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white rounded-md p-3 border border-gray-200">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <FileText size={16} className="text-green-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900 truncate" title={file.name}>
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remove file"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Total File Size */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-600">
                                            Total size: {formatFileSize(getTotalFileSize())}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* File Count Indicator */}
                            {attachments.length > 0 && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-700">
                                        ✓ {attachments.length} file{attachments.length > 1 ? 's' : ''} ready to upload
                                        {attachments.length < 4 && (
                                            <span className="text-blue-600"> • You can add {4 - attachments.length} more file{4 - attachments.length > 1 ? 's' : ''}</span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Attach Timesheet Checkbox */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="attachTimesheet"
                                    checked={attachTimesheet}
                                    onChange={(e) => setAttachTimesheet(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                                />
                                <div className="flex-1">
                                    <label htmlFor="attachTimesheet" className="text-sm font-medium text-blue-900 cursor-pointer">
                                        Include Timesheet Reference in PDF
                                    </label>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {viewMode === "Weekly" 
                                            ? "Include a detailed weekly timesheet table in the generated invoice PDF"
                                            : "Include a detailed monthly timesheet table in the generated invoice PDF"
                                        }
                                    </p>
                                    {timesheetData && (
                                        <p className="text-xs text-blue-500 mt-1">
                                            ✓ Timesheet data available for {viewMode?.toLowerCase() || 'current'} view
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-lg font-medium text-gray-900">Generating Invoice...</p>
                            <p className="text-sm text-gray-600">
                                {attachTimesheet 
                                    ? `Including ${viewMode?.toLowerCase() || ''} timesheet data...`
                                    : attachments.length > 0 
                                        ? `Processing ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}...`
                                        : 'Please wait while we create your invoice'
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
                        onClick={handleReset}
                        disabled={loading}
                        className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {attachTimesheet ? 'Including Timesheet...' : attachments.length > 0 ? 'Uploading...' : 'Generating...'}
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2" size={16} />
                                Generate Invoice
                                {(attachments.length > 0 || attachTimesheet) && (
                                    <span className="ml-1 bg-green-600 text-green-200 text-xs px-1.5 py-0.5 rounded-full">
                                        {attachTimesheet ? '+📊' : `+${attachments.length}`}
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddInvoiceModal;