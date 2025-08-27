import React, { useState, useRef, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import OrganizationSelect from './OrganizationSelect'; // Import OrganizationSelect
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
    Trash2,
    EyeIcon
} from 'lucide-react';
import GlobalSnackbar from './GlobalSnackbar';

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
    // currentWeekStart,
    // currentMonthRange,
    employee
}) => {
    const [formData, setFormData] = useState({
        invoiceName: '',
        customerName: '',
        customerAddress: '',
        customerInfo: '',
        supplierName: sessionStorage.getItem('tenantName') || '',
        supplierAddress: '',
        supplierInfo: '',
        employeeName: '',
        rate: '',
        currency: 'USD',
        fromDate: '',
        toDate: '',
        hoursSpent: '',
        totalAmount: '',
        remarks: '',
        employeeId: ''
    });

    // const [customers, setCustomers] = useState([]);
    // const [suppliers, setSuppliers] = useState([]);
    const [employees, setEmployees] = useState([]);
    // const [customerAddresses, setCustomerAddresses] = useState([]);
    // const [supplierAddresses, setSupplierAddresses] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [fetchedTasks, setFetchedTasks] = useState([]);
    // const [fetchingTasks, setFetchingTasks] = useState(false);

    const [fetchingTasks, setFetchingTasks] = useState(false);
    // Single attachment field that handles multiple files (up to 4)
    const [attachments, setAttachments] = useState([]);
    const [attachTimesheet, setAttachTimesheet] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    })
    const [timesheetPreviewData, setTimesheetPreviewData] = useState(null)
    const fromDateInputRef = useRef(null);
    const toDateInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const getMonthDiff = (d1, d2) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        let months;
        months = (date2.getFullYear() - date1.getFullYear()) * 12;
        months -= date1.getMonth();
        months += date2.getMonth();
        return months + (date2.getDate() >= date1.getDate() ? 0 : -1);
    };

    // ...existing code...
    useEffect(() => {
        const fetchTasksForRange = async () => {
            if (
                formData.fromDate &&
                formData.toDate &&
                formData.employeeName &&
                employees.length > 0
            ) {
                const selectedEmployee = employees.find(emp => emp.userId === formData.employeeId);
                if (!selectedEmployee || !selectedEmployee.userId) return;

                // setFetchingTasks(true);
                try {
                    const res = await axios.get(
                        `${API_BASE_URL}/api/timesheet-tasks/admin-between`,
                        {
                            params: {
                                start: (() => {
                                    const d = new Date(formData.fromDate);
                                    d.setDate(d.getDate() - 1);
                                    return d.toISOString().split('T')[0];
                                })(),
                                end: formData.toDate,
                                userId: selectedEmployee.userId
                            },
                            headers: { Authorization: sessionStorage.getItem("token") }
                        }
                    );
                    setFetchedTasks(res.data || []);

                    // Calculate total minutes
                    let totalMinutes = 0;
                    (res.data || []).forEach(task => {
                        totalMinutes += (task.hoursSpent || 0) * 60 + (task.minutesSpent || 0);
                    });
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    const decimalHours = (hours + minutes / 60).toFixed(2);

                    // Only auto-populate if user hasn't manually changed hoursSpent
                    setFormData(prev => ({
                        ...prev,
                        hoursSpent: decimalHours
                    }));

                } catch (error) {
                    console.error('Error fetching tasks:', error);
                    setFetchedTasks([]);
                } finally {
                    // setFetchingTasks(false);
                }
            } else {
                setFetchedTasks([]);
            }
        };

        fetchTasksForRange();
    }, [formData.fromDate, formData.toDate, formData.employeeName, formData.employeeId, employees]);


    // ...existing code...

    // Helper functions for timesheet data processing
    // const formatDate = (date) =>
    //     date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

    // const formatDateKey = (date) => date.toISOString().split("T")[0];

    // const isWeekend = (date) => {
    //     const day = date.getDay();
    //     return day === 0 || day === 6;
    // };

    // const getWeekDates = (startDate) => {
    //     const dates = [];
    //     for (let i = 0; i < 7; i++) {
    //         const date = new Date(startDate);
    //         date.setDate(startDate.getDate() + i);
    //         dates.push(date);
    //     }
    //     return dates;
    // };

    // const getMonthDates = () => {
    //     const dates = [];
    //     const current = new Date(currentMonthRange.start);
    //     while (current <= currentMonthRange.end) {
    //         dates.push(new Date(current));
    //         current.setDate(current.getDate() + 1);
    //     }
    //     return dates;
    // };

    // const getCurrentDates = () => (viewMode === "Weekly" ? getWeekDates(currentWeekStart) : getMonthDates());

    // const getTimeEntries = (date) => {
    //     const dateKey = formatDateKey(date);
    //     return timesheetData[dateKey] || [];
    // };

    // const getDayTotalTime = (date) => {
    //     const entries = getTimeEntries(date);
    //     let totalMinutes = entries.reduce((total, entry) => {
    //         return total + (entry.hours || 0) * 60 + (entry.minutes || 0);
    //     }, 0);

    //     const hours = Math.floor(totalMinutes / 60);
    //     const minutes = totalMinutes % 60;

    //     return { hours, minutes };
    // };

    // ...existing code...
    const prepareTimesheetData = () => {
        if (!attachTimesheet || !fetchedTasks.length) return null;

        let totalMinutes = 0;
        const timesheetEntries = fetchedTasks.map(task => {
            totalMinutes += (task.hoursSpent || 0) * 60 + (task.minutesSpent || 0);
            setTimesheetPreviewData([{
                date: task.date, // format as needed
                dayOfWeek: new Date(task.date).toLocaleDateString("en-GB", { weekday: "short" }),
                isWeekend: [0, 6].includes(new Date(task.date).getDay()),
                taskType: task.taskType || '',
                taskTopic: task.taskTopic || '',
                hours: task.hoursSpent || 0,
                minutes: task.minutesSpent || 0,
                description: task.description || '',
                project: task.projectName || '',
                submitted: task.submitted || false
            }
            ])
            return {
                date: task.date, // format as needed
                dayOfWeek: new Date(task.date).toLocaleDateString("en-GB", { weekday: "short" }),
                isWeekend: [0, 6].includes(new Date(task.date).getDay()),
                taskType: task.taskType || '',
                taskTopic: task.taskTopic || '',
                hours: task.hoursSpent || 0,
                minutes: task.minutesSpent || 0,
                description: task.description || '',
                project: task.projectName || '',
                submitted: task.submitted || false
            };
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        // const decimalHours = parseFloat((hours + minutes / 60).toFixed(2));

        // Calculate target hours: count working days (Mon-Fri) in the selected range
        let targetHours = 0;
        if (formData.fromDate && formData.toDate) {
            const start = new Date(formData.fromDate);
            const end = new Date(formData.toDate);
            let current = new Date(start);
            while (current <= end) {
                const day = current.getDay();
                if (day !== 0 && day !== 6) { // Mon-Fri
                    targetHours += 8; // or your standard workday hours
                }
                current.setDate(current.getDate() + 1);
            }
        }

        return {
            viewMode: "Custom",
            period: `${formData.fromDate} - ${formData.toDate}`,
            employeeName: formData.employeeName,
            employeeEmail: '', // fill if available
            entries: timesheetEntries,
            totalHours: hours,
            totalMinutes: minutes,
            targetHours // now correctly calculated
        };
    };
    // ...existing code...

    // Auto-populate employee fields if coming from timesheet (after reset)
    useEffect(() => {
        console.log(employee)
        if (employee && open) {
            // Use setTimeout to ensure this runs after the reset
            setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    employeeId: employee.rawData?.userId || employee.id || "",
                    employeeName: employee.name || '',
                    rate: employee.rawData?.cost || '',
                    currency: employee.rawData?.unit || employee.rawData?.currency || 'USD'
                }));
            }, 100);
        }
    }, [employee, open]);



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

    // Initialize dropdown data when modal opens and auto-reset form
    useEffect(() => {
        if (open) {
            fetchDropdownData();
            // Auto-reset form when modal opens
            handleReset();
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
            // const customerOptionsWithAddress = res.data.map(emp => ({
            //     label: `${emp.name} ${emp.empCode ? `(${emp.empCode})` : ''}`.trim(),
            //     value: emp.name,
            //     empCode: emp.empCode,
            //     cost: emp.cost,
            //     email: emp.email,
            //     userId: emp.userId,
            //     status: emp.status,
            //     address: (() => {
            //         const addressParts = [];
            //         if (emp.city) addressParts.push(emp.city);
            //         if (emp.state) addressParts.push(emp.state);
            //         if (emp.country) addressParts.push(emp.country);

            //         if (addressParts.length > 0) {
            //             return addressParts.join(', ');
            //         } else {
            //             return `Address for ${emp.name}`;
            //         }
            //     })(),
            //     city: emp.city,
            //     state: emp.state,
            //     country: emp.country,
            //     mobilePhone: emp.mobilePhone,
            //     currency: emp.unit || emp.currency || 'USD'
            // }));

            setEmployees(employeeOptions);

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setEmployees([]);
            alert(`Failed to fetch employee data: ${error.message}`);
            setCustomers([]);
            setSuppliers([]);
            setCustomerAddresses([]);
            setSupplierAddresses([]);
            setErrors({
                submit: "Failed to fetch Employees, please try again."
            })
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
        let value = event.target.value;
        if (field === 'hoursSpent') {
            // Allow only numbers and one decimal point
            value = value.replace(/[^0-9.]/g, '');
            // Prevent multiple decimals
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
        }
        setFormData(prev => {
            let updated = { ...prev, [field]: value };

            // ...existing fromDate/toDate validation logic...
            if (field === 'fromDate' && prev.toDate) {
                if (new Date(prev.toDate) < new Date(value) ||
                    getMonthDiff(value, prev.toDate) > 1 ||
                    (getMonthDiff(value, prev.toDate) === 1 && new Date(prev.toDate).getDate() > new Date(value).getDate())
                ) {
                    updated.toDate = '';
                }
            }
            if (field === 'toDate' && prev.fromDate) {
                if (new Date(value) < new Date(prev.fromDate) ||
                    getMonthDiff(prev.fromDate, value) > 1 ||
                    (getMonthDiff(prev.fromDate, value) === 1 && new Date(value).getDate() > new Date(prev.fromDate).getDate())
                ) {
                    return prev;
                }
            }
            return updated;
        });
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // const handleSelectChange = (field) => (selectedOption) => {
    //     setFormData(prev => ({
    //         ...prev,
    //         [field]: selectedOption?.value || ''
    //     }));
    //     if (errors[field]) {
    //         setErrors(prev => ({ ...prev, [field]: '' }));
    //     }
    // };

    // Handler for customer organization selection with full details
    const handleCustomerOrgSelect = (orgData) => {
        if (orgData) {
            // Build address from organization data
            let addressParts = [];
            if (orgData.orgAddress) addressParts.push(orgData.orgAddress);
            if (orgData.orgCity) addressParts.push(orgData.orgCity);
            if (orgData.orgState) addressParts.push(orgData.orgState);
            if (orgData.orgCountry) addressParts.push(orgData.orgCountry);
            if (orgData.orgZip) addressParts.push(orgData.orgZip);

            const finalAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

            // Build info string with GST/Tax details
            let infoParts = [];
            if (orgData.orgTaxName) infoParts.push(`GST/Tax Name: ${orgData.orgTaxName}`);
            if (orgData.orgTaxId) infoParts.push(`Tax ID: ${orgData.orgTaxId}`);
            if (orgData.orgDesc) infoParts.push(`Description: ${orgData.orgDesc}`);

            const finalInfo = infoParts.length > 0 ? infoParts.join(' | ') : '';

            setFormData(prev => ({
                ...prev,
                customerAddress: finalAddress,
                customerInfo: finalInfo
            }));
        } else {
            // Clear related fields when customer is cleared
            setFormData(prev => ({
                ...prev,
                customerAddress: '',
                customerInfo: ''
            }));
        }
    };

    // Handler for supplier organization selection with full details
    const handleSupplierOrgSelect = (orgData) => {
        if (orgData) {
            // Build address from organization data
            let addressParts = [];
            if (orgData.orgAddress) addressParts.push(orgData.orgAddress);
            if (orgData.orgCity) addressParts.push(orgData.orgCity);
            if (orgData.orgState) addressParts.push(orgData.orgState);
            if (orgData.orgCountry) addressParts.push(orgData.orgCountry);
            if (orgData.orgZip) addressParts.push(orgData.orgZip);

            const finalAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

            // Build info string with GST/Tax details
            let infoParts = [];
            if (orgData.orgTaxName) infoParts.push(`GST/Tax Name: ${orgData.orgTaxName}`);
            if (orgData.orgTaxId) infoParts.push(`Tax ID: ${orgData.orgTaxId}`);
            if (orgData.orgDesc) infoParts.push(`Description: ${orgData.orgDesc}`);

            const finalInfo = infoParts.length > 0 ? infoParts.join(' | ') : '';

            setFormData(prev => ({
                ...prev,
                supplierAddress: finalAddress,
                supplierInfo: finalInfo
            }));
        } else {
            // Clear related fields when supplier is cleared
            setFormData(prev => ({
                ...prev,
                supplierAddress: '',
                supplierInfo: ''
            }));
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
                employeeId: selectedOption.userId || '',
                employeeName: selectedOption.value,
                rate: newRate,
                currency: newCurrency
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                employeeId: '',
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

        // Invoice name is now optional - no validation needed
        if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
        if (!formData.supplierName.trim()) newErrors.supplierName = 'Supplier name is required';
        if (!formData.employeeName.trim()) newErrors.employeeName = 'Employee name is required';
        if (!formData.rate || parseFloat(formData.rate) <= 0) newErrors.rate = 'Valid rate is required';
        if (!formData.fromDate) newErrors.fromDate = 'From date is required';
        if (!formData.toDate) newErrors.toDate = 'To date is required';
        if (!formData.hoursSpent || isNaN(parseFloat(formData.hoursSpent)) || parseFloat(formData.hoursSpent) <= 0) {
            newErrors.hoursSpent = 'Valid hours are required';
        }

        if (formData.fromDate && formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate)) {
            newErrors.toDate = 'To date must be after from date';
        }

        // Validate character limits
        if (formData.customerAddress && formData.customerAddress.length > 500) {
            newErrors.customerAddress = 'Customer address cannot exceed 500 characters';
        }
        if (formData.customerInfo && formData.customerInfo.length > 100) {
            newErrors.customerInfo = 'Customer info cannot exceed 100 characters';
        }
        if (formData.supplierAddress && formData.supplierAddress.length > 500) {
            newErrors.supplierAddress = 'Supplier address cannot exceed 500 characters';
        }
        if (formData.supplierInfo && formData.supplierInfo.length > 100) {
            newErrors.supplierInfo = 'Supplier info cannot exceed 100 characters';
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
                customerInfo: formData.customerInfo || "",
                supplierName: formData.supplierName,
                supplierAddress: formData.supplierAddress || "",
                supplierInfo: formData.supplierInfo || "",
                employeeName: formData.employeeName,
                rate: parseFloat(formData.rate),
                currency: formData.currency,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                hoursSpent: parseFloat(formData.hoursSpent),
                totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
                remarks: formData.remarks || "",
                // Include timesheet data if checkbox is checked
                timesheetData: timesheetPreviewData ? prepareTimesheetData() : null
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
            setSnackbar((prev) => ({
                ...prev,
                open: true,
                message: "PO Consumption Created Successfully",
                severity: "success",
            }))


            // Call parent's onSubmit if provided
            if (onSubmit) {
                onSubmit(response.data);
            }

            // Ask user if they want to download the PDF
            if (response.data.invoiceId) {
                setTimeout(() => {
                    handleDownloadInvoice(response.data.invoiceId, response.data.invoiceName);
                }, 500);
            }

            handleReset();
            onClose();

        } catch (error) {
            console.error('Error creating invoice:', error);

            let errorMessage = 'Failed to create invoice. Please try again.';
            setErrors({
                submit: errorMessage
            })
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }

            setSnackbar((prev) => ({
                ...prev,
                open: true,
                message: errorMessage,
                severity: "error",
            }))

        } finally {
            setLoading(false);
        }
    };
    const handleInvoicePreview = async () => {
        try {
            const invoiceData = {
                invoiceName: formData.invoiceName || "",
                customerName: formData.customerName || "",
                customerAddress: formData.customerAddress || "",
                customerInfo: formData.customerInfo || "",
                supplierName: formData.supplierName || "",
                supplierAddress: formData.supplierAddress || "",
                supplierInfo: formData.supplierInfo || "",
                employeeName: formData.employeeName || "",
                rate: parseFloat(formData.rate) || 0,
                currency: formData.currency || "",
                fromDate: formData.fromDate || "",
                toDate: formData.toDate || "",
                hoursSpent: parseFloat(formData.hoursSpent) || 0,
                totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
                remarks: formData.remarks || "",
                // Include timesheet data if checkbox is checked
                timesheetData: attachTimesheet ? prepareTimesheetData() : null
            };
            const response = await axios.post(
                `${API_BASE_URL}/api/invoices/preview`,
                invoiceData,
                {
                    headers: {
                        Authorization: sessionStorage.getItem("token"),
                        "Content-Type": "application/json"
                    },
                    responseType: 'blob'
                }
            )
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // --- Download ---
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoicepreview.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // --- Open in new tab ---
            window.open(url, '_blank');

            // Cleanup after a short delay (so the object URL is still valid for the new tab)
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 5000);

            console.log(response.data)

        } catch (error) {
            console.error("Failed to preview invoice:", error);
        }
    }
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

            // --- Download ---
            const link = document.createElement('a');
            link.href = url;
            link.download = `${invoiceName || invoiceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // --- Open in new tab ---
            window.open(url, '_blank');

            // Cleanup after a short delay (so the object URL is still valid for the new tab)
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 5000);

        } catch (error) {
            console.error("Failed to download invoice:", error);
            setSnackbar((prev) => ({
                ...prev,
                open: true,
                message: "Failed to download invoice. Please try again.",
                severity: "error",
            }))
        }
    };


    const handleReset = () => {
        setFormData({
            invoiceName: '',
            customerName: '',
            customerAddress: '',
            customerInfo: '',
            supplierName: sessionStorage.getItem('tenantName') || '',
            supplierAddress: '',
            supplierInfo: '',
            employeeName: '',
            rate: '',
            currency: 'USD',
            fromDate: '',
            toDate: '',
            hoursSpent: '',
            totalAmount: '',
            remarks: '',
            employeeId: ''
        });
        setErrors({});
        setAttachments([]);
        setAttachTimesheet(false);
        setFetchedTasks([]);
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
    const handleDateInputClick = (inputName) => {
        const dateInput = document.getElementsByName(inputName)[0];
        if (dateInput) {
            dateInput.showPicker();
        }
    };
    const getTimesheetSummary = () => {
        if (!attachTimesheet || !fetchedTasks.length) return null;

        let totalMinutes = 0;
        let taskCount = fetchedTasks.length;

        fetchedTasks.forEach(task => {
            totalMinutes += (task.hoursSpent || 0) * 60 + (task.minutesSpent || 0);
        });

        const totalHours = Math.floor(totalMinutes / 60);
        const totalMinutesRemainder = totalMinutes % 60;

        return {
            period: "Custom",
            totalHours,
            totalMinutes: totalMinutesRemainder,
            taskCount,
            dateRange: `${formData.fromDate} - ${formData.toDate}`
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
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                                <span className="text-red-700 text-sm">{errors.submit}</span>
                            </div>
                        )}
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
                                    Invoice Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter invoice name (optional)"
                                    value={formData.invoiceName}
                                    onChange={handleChange('invoiceName')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.invoiceName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    maxLength={100}
                                />
                                <div className="text-right text-sm text-gray-500 mt-1">
                                    {formData.invoiceName.length}/100 characters
                                </div>
                                {errors.invoiceName && <p className="text-red-500 text-xs mt-1">{errors.invoiceName}</p>}
                            </div>
                        </div>

                        {/* 2nd Line: Customer Name and Customer Address */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer Name *
                                    {loadingEmployees && <span className="text-xs text-gray-500 ml-1">(Loading...)</span>}
                                </label>
                                <OrganizationSelect
                                    value={formData.customerName || ''}
                                    onChange={(value) => setFormData(prev => ({ ...prev, customerName: value }))}
                                    onOrgSelect={handleCustomerOrgSelect}
                                    placeholder="Search for customer or type new..."
                                    orgType="CUSTOMER"
                                    isDisabled={loadingEmployees}
                                    className="w-full"
                                />
                                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                            </div>

                            <div className="">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer Address
                                    <span className="text-xs text-gray-500 ml-1">(Auto-filled)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Customer address"
                                    value={formData.customerAddress}
                                    onChange={handleChange('customerAddress')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.customerAddress ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={500}
                                />
                                <div className="text-right text-sm text-gray-500 mt-1">
                                    {formData.customerAddress.length}/500 characters
                                </div>
                                {errors.customerAddress && <p className="text-red-500 text-xs mt-1">{errors.customerAddress}</p>}
                            </div>
                            <div className="">
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Customer Info
                                </label>
                                <input
                                    type='text'
                                    placeholder='Enter customer info'
                                    value={formData.customerInfo}
                                    onChange={handleChange('customerInfo')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.customerInfo ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={200}
                                />
                                <div className="text-right text-sm text-gray-500 mt-1">
                                    {formData.customerInfo.length}/200 characters
                                </div>
                                {errors.customerInfo && <p className="text-red-500 text-xs mt-1">{errors.customerInfo}</p>}
                            </div>
                        </div>

                        {/* 3rd Line: Supplier Name and Supplier Address */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Supplier Name *
                                </label>
                                <OrganizationSelect
                                    value={formData.supplierName || ''}
                                    onChange={(value) => setFormData(prev => ({ ...prev, supplierName: value }))}
                                    onOrgSelect={handleSupplierOrgSelect}
                                    placeholder="Search for supplier or type new..."
                                    orgType="SUPPLIER"
                                    isDisabled={loadingEmployees}
                                    className="w-full"
                                />
                                {errors.supplierName && <p className="text-red-500 text-xs mt-1">{errors.supplierName}</p>}
                            </div>

                            <div className="">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Supplier Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter supplier address"
                                    value={formData.supplierAddress}
                                    onChange={handleChange('supplierAddress')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.supplierAddress ? 'border-red-500' : 'border-gray-500'}`}
                                    maxLength={500}
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {formData.supplierAddress.length}/500 characters
                                </div>
                                {errors.supplierAddress && <p className="text-red-500 text-xs mt-1">{errors.supplierAddress}</p>}
                            </div>
                            <div className="">
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Supplier Info
                                </label>
                                <input
                                    type='text'
                                    placeholder='Enter supplier info'
                                    value={formData.supplierInfo}
                                    onChange={handleChange('supplierInfo')}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.supplierInfo ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={200}
                                />
                                <div className="text-right text-sm text-gray-500 mt-1">
                                    {formData.supplierInfo.length}/200 characters
                                </div>
                                {errors.supplierInfo && <p className="text-red-500 text-xs mt-1">{errors.supplierInfo}</p>}
                            </div>
                        </div>




                        <div className="grid grid-cols-3 gap-4">
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
                                    <span className="text-xs text-gray-500 ml-1">(per hour)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-semibold">
                                        {currencySymbols[formData.currency] || '$'}

                                    </span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.rate}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/[^0-9.]/g, '');
                                            const parts = value.split('.');
                                            if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                            if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                            if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                            value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                            e.target.value = value;
                                            handleChange('rate')(e);
                                        }}
                                        className={`w-full h-10 pl-8 pr-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.rate ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        step="0.01"
                                        min="0.01"
                                        pattern="^\d{1,13}(\.\d{0,2})?$"
                                        inputMode="decimal"
                                    />
                                </div>
                                {errors.rate && <p className="text-red-500 text-xs mt-1">{errors.rate}</p>}
                            </div>


                        </div>

                        {/* 4th Line: Include Timesheet Reference Checkbox */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="attachTimesheet"
                                    checked={attachTimesheet}
                                    onChange={(e) => setAttachTimesheet(e.target.checked)}
                                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                                />
                                <div className="flex-1">
                                    <label htmlFor="attachTimesheet" className="text-sm font-medium text-green-900 cursor-pointer">
                                        Include Timesheet Reference in PDF
                                    </label>
                                    <p className="text-xs text-green-600 mt-1">
                                        {viewMode === "Weekly"
                                            ? "Include a detailed weekly timesheet table in the generated invoice PDF"
                                            : "Include a detailed monthly timesheet table in the generated invoice PDF"
                                        }
                                    </p>
                                    {timesheetData && (
                                        <p className="text-xs text-green-500 mt-1">
                                            ✓ Timesheet data available for {viewMode?.toLowerCase() || 'current'} view
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Timesheet Summary (when timesheet is attached) */}
                            {attachTimesheet && getTimesheetSummary() && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
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
                        </div>

                        {/* 5th Line: Employee Name, Currency, Rate, Hours Spent */}


                        {/* 6th Line: From Date and To Date */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    From Date *
                                </label>
                                <div
                                    className={`relative w-full h-10 pl-10 pr-4 border rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 flex items-center ${errors.fromDate ? "border-red-500" : "border-gray-300"
                                        }`}
                                >
                                    <Calendar
                                        onClick={() => fromDateInputRef.current?.showPicker?.()}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 cursor-pointer"
                                        size={16}
                                    />
                                    <input
                                        ref={fromDateInputRef}
                                        type="date"
                                        value={formData.fromDate}
                                        onChange={(e) => {
                                            let value = e.target.value;

                                            // ✅ Ensure year part is at most 4 digits
                                            if (value) {
                                                const [year, month, day] = value.split("-");
                                                if (year && year.length > 4) {
                                                    value = `${year.slice(0, 4)}-${month || "01"}-${day || "01"}`;
                                                }
                                            }

                                            handleChange("fromDate")({ target: { value } });
                                        }}
                                        className="w-full bg-transparent outline-none"
                                        max={formData.toDate || ""}
                                    />
                                </div>
                                {errors.fromDate && <p className="text-red-500 text-xs mt-1">{errors.fromDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To Date *
                                </label>
                                <div
                                    className={`relative w-full h-10 pl-10 pr-4 border rounded-md focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 flex items-center ${errors.toDate ? "border-red-500" : "border-gray-300"
                                        }`}
                                >
                                    <Calendar
                                        onClick={() => toDateInputRef.current?.showPicker?.()}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 cursor-pointer"
                                        size={16}
                                    />
                                    <input
                                        ref={toDateInputRef}
                                        type="date"
                                        value={formData.toDate}
                                        onChange={(e) => {
                                            let value = e.target.value;

                                            // ✅ Ensure year part is at most 4 digits
                                            if (value) {
                                                const [year, month, day] = value.split("-");
                                                if (year && year.length > 4) {
                                                    value = `${year.slice(0, 4)}-${month || "01"}-${day || "01"}`;
                                                }
                                            }

                                            handleChange("toDate")({ target: { value } });
                                        }}
                                        className="w-full bg-transparent outline-none"
                                        min={formData.fromDate}
                                        max={
                                            formData.fromDate
                                                ? (() => {
                                                    const d = new Date(formData.fromDate);
                                                    d.setMonth(d.getMonth() + 2);
                                                    return d.toISOString().split("T")[0];
                                                })()
                                                : ""
                                        }
                                    />
                                </div>

                                {/* Existing required error */}
                                {errors.toDate && (
                                    <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>
                                )}

                                {/* ✅ New Date Range Validation Error */}
                                {formData.fromDate &&
                                    formData.toDate &&
                                    (new Date(formData.toDate) < new Date(formData.fromDate) ||
                                        new Date(formData.toDate) >
                                        (() => {
                                            const d = new Date(formData.fromDate);
                                            d.setMonth(d.getMonth() + 2);
                                            return d;
                                        })()) && (
                                        <p className="text-red-500 text-xs mt-1">
                                            To Date must be between From Date and 2 months after it.
                                        </p>
                                    )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hours Spent *
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.hoursSpent}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/[^0-9.]/g, '');
                                        const parts = value.split('.');
                                        if (parts.length > 2) value = parts[0] + '.' + parts[1];
                                        if (parts[0].length > 13) parts[0] = parts[0].slice(0, 13);
                                        if (parts[1]) parts[1] = parts[1].slice(0, 2);
                                        value = parts[1] !== undefined ? parts[0] + '.' + parts[1] : parts[0];
                                        e.target.value = value;
                                        handleChange('hoursSpent')(e);
                                    }}
                                    className={`w-full h-10 px-4 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.hoursSpent ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    step="0.01"
                                    min="0"
                                    pattern="^\d{1,13}(\.\d{0,2})?$"
                                    inputMode="decimal"
                                />
                                {errors.hoursSpent && <p className="text-red-500 text-xs mt-1">{errors.hoursSpent}</p>}
                            </div>
                        </div>


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
                        onClick={handleInvoicePreview}
                        disabled={loading}
                        className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50"
                    >
                        Preview
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
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
};

export default AddInvoiceModal;