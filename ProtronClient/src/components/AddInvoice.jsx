import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
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
    EyeIcon,
    Folder,
    AlertCircle
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
    employee,
    isFromInvoiceManagement = false
}) => {
    const [formData, setFormData] = useState({
        invoiceName: '',
        invoiceType: 'DOMESTIC',
        invoiceDate: '',
        taxId: '',
        billPeriod: '',
        customerName: '',
        billToAddress: '',
        shipToAddress: '',
        customerInfo: '',
        supplierName: sessionStorage.getItem('tenantName') || '',
        supplierAddress: '',
        supplierInfo: '',
        country: '',
        employeeName: '',
        employeeNames: [],
        employeeIds: [],
        rate: '',
        currency: 'USD',
        fromDate: '',
        toDate: '',
        hoursSpent: '',
        totalAmount: '',
        remarks: '',
        projectName: '',
        employeeId: ''
    });

    // Table headers editable by user
    const [tableHeaders, setTableHeaders] = useState({
        col1: 'Item Description',
        col2: 'Rate',
        col3: 'Quantity',
        col4: 'Amount (Currency)',
        col5: 'Remarks'
    });

    // Invoice line items (max 5)
    const [items, setItems] = useState([
        { id: 1, description: '', rate: '', quantity: '', amount: '', remarks: '' }
    ]);

    // Employee rows (max 5). Each row holds selected employee and line fields
    const [invoiceEmployees, setInvoiceEmployees] = useState([
        { id: 1, userId: '', rate: '', quantity: '', amount: '', remarks: '' }
    ]);

    // const [customers, setCustomers] = useState([]);
    // const [suppliers, setSuppliers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);

    const projectOptions = useMemo(() => {
        return (projects || []).map(p => ({ value: p.projectName, label: p.projectName, projectId: p.projectId, projectCode: p.projectCode }));
    }, [projects]);
    // const [customerAddresses, setCustomerAddresses] = useState([]);
    // const [supplierAddresses, setSupplierAddresses] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [fetchedTasks, setFetchedTasks] = useState([]);
    // projects state not required in this component
    // Single attachment field that handles multiple files (up to 4)
    const [attachments, setAttachments] = useState([]);
    const [attachTimesheet, setAttachTimesheet] = useState(false);
    // Bill period uses `formData.fromDate` and `formData.toDate`
    const [timesheetRef, setTimesheetRef] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    })
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
        // Persist draft to sessionStorage so values aren't lost when switching tabs
        try {
            const draft = {
                formData,
                items,
                invoiceEmployees,
                attachments,
                attachTimesheet,
                fetchedTasks
            };
            sessionStorage.setItem('addInvoiceDraft', JSON.stringify(draft));
        } catch {
            /* ignore storage errors */
        }
    }, [formData, items, invoiceEmployees, attachments, attachTimesheet, fetchedTasks]);

        useEffect(() => {
        const fetchTasksForRange = async () => {
            const selectedRows = (invoiceEmployees || []).filter(e => e.userId);
            if (
                formData.fromDate &&
                formData.toDate &&
                selectedRows.length === 1 &&
                employees.length > 0
            ) {
                const selectedEmployee = employees.find(emp => emp.userId === selectedRows[0].userId);
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
        }, [formData.fromDate, formData.toDate, employees, invoiceEmployees]);


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

    // attachments count helper not needed; compute inline where required

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

    const fetchDropdownData = useCallback(async () => {
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

            setEmployees(employeeOptions);

            // projects not needed here

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setEmployees([]);
            alert(`Failed to fetch employee data: ${error.message}`);
            setErrors({
                submit: "Failed to fetch Employees, please try again."
            })
        } finally {
            setLoadingEmployees(false);
        }
    }, []);

    // Initialize dropdown data when modal opens and auto-reset form
    useEffect(() => {
        if (open) {
            fetchDropdownData();
            fetchProjects();
            // Restore draft if present, otherwise initialize
            try {
                const draft = sessionStorage.getItem('addInvoiceDraft');
                if (draft) {
                    const parsed = JSON.parse(draft);
                    if (parsed) {
                        setFormData(parsed.formData || {});
                        setItems(parsed.items || [{ id: 1, description: '', rate: '', quantity: '', amount: '', remarks: '' }]);
                        setInvoiceEmployees(parsed.invoiceEmployees || [{ id: 1, userId: '', rate: '', quantity: '', amount: '', remarks: '' }]);
                        setAttachments(parsed.attachments || []);
                        setAttachTimesheet(parsed.attachTimesheet || false);
                        setFetchedTasks(parsed.fetchedTasks || []);
                        // do not clear draft here
                    } else {
                        handleReset();
                    }
                } else {
                    handleReset();
                }
            } catch (e) {
                console.error('Failed to restore invoice draft:', e);
                handleReset();
            }
        }
    }, [open, fetchDropdownData]);

    const fetchProjects = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const response = await axios.get(
                `${API_BASE_URL}/api/invoices/projects`,
                {
                    headers: { Authorization: token }
                }
            );
            setProjects(response.data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        }
    };

    // fetchProjects removed - not used in this component

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
                // update billPeriod when both dates available
                if (updated.fromDate && updated.toDate) {
                    updated.billPeriod = `${updated.fromDate} - ${updated.toDate}`;
                } else {
                    updated.billPeriod = '';
                }
            }
            if (field === 'toDate' && prev.fromDate) {
                if (new Date(value) < new Date(prev.fromDate) ||
                    getMonthDiff(prev.fromDate, value) > 1 ||
                    (getMonthDiff(prev.fromDate, value) === 1 && new Date(value).getDate() > new Date(prev.fromDate).getDate())
                ) {
                    return prev;
                }
                // update billPeriod when both dates available
                if (updated.fromDate && updated.toDate) {
                    updated.billPeriod = `${updated.fromDate} - ${updated.toDate}`;
                } else {
                    updated.billPeriod = '';
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
                billToAddress: finalAddress,
                shipToAddress: finalAddress,
                customerInfo: finalInfo,
                country: orgData.orgCountry || prev.country
            }));
        } else {
            // Clear related fields when customer is cleared
            setFormData(prev => ({
                ...prev,
                billToAddress: '',
                shipToAddress: '',
                customerInfo: '',
                country: ''
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
    // Top-level employee select handler removed (employee rows in table are used)

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

    // ------- Table & Employee row handlers -------
    const updateTableHeader = (key, value) => {
        setTableHeaders(prev => ({ ...prev, [key]: value }));
    };

    const updateItemField = (id, field, value) => {
        setItems(prev => prev.map(it => {
            if (it.id !== id) return it;
            const next = { ...it, [field]: value };
            // recalc amount when rate or quantity change
            const rate = parseFloat(next.rate) || 0;
            const qty = parseFloat(next.quantity) || 0;
            next.amount = (rate * qty).toFixed(2);
            return next;
        }));
    };

    const addItem = () => {
        if (items.length >= 5) return setSnackbar({ open: true, message: 'Maximum 5 items allowed', severity: 'error' });
        const nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
        setItems(prev => ([...prev, { id: nextId, description: '', rate: '', quantity: '', amount: '', remarks: '' }]));
    };

    const removeItem = (id) => {
        if (items.length <= 1) return; // keep at least one item
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const addEmployeeRow = () => {
        if (invoiceEmployees.length >= 5) return setSnackbar({ open: true, message: 'Maximum 5 employees allowed', severity: 'error' });
        const nextId = invoiceEmployees.length ? Math.max(...invoiceEmployees.map(i => i.id)) + 1 : 1;
        setInvoiceEmployees(prev => ([...prev, { id: nextId, userId: '', rate: '', quantity: '', amount: '', remarks: '' }]));
    };

    const removeEmployeeRow = (id) => {
        if (invoiceEmployees.length <= 1) return; // keep at least one row
        setInvoiceEmployees(prev => prev.filter(e => e.id !== id));
    };

    const updateEmployeeRow = (id, field, value) => {
        setInvoiceEmployees(prev => {
            const next = prev.map(e => e.id === id ? { ...e, [field]: value } : e);
            const selectedCount = next.filter(e => e.userId).length;
            if (selectedCount !== 1 && attachTimesheet) setAttachTimesheet(false);
            // Recalculate amount for the updated row if rate/quantity changed
            return next.map(e => {
                if (e.id !== id) return e;
                const rate = parseFloat(e.rate) || 0;
                const qty = parseFloat(e.quantity) || 0;
                return { ...e, amount: (rate * qty).toFixed(2) };
            });
        });
    };

    // Ensure timesheet checkbox is disabled when selected employees count is not exactly one
    useEffect(() => {
        const selectedCount = (invoiceEmployees || []).filter(e => e.userId).length;
        if (selectedCount !== 1 && attachTimesheet) {
            setAttachTimesheet(false);
        }
    }, [invoiceEmployees, attachTimesheet]);

    const computeItemsTotal = () => {
        const itemsTotal = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
        const empTotal = (invoiceEmployees || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        return (itemsTotal + empTotal).toFixed(2);
    };

    // When timesheet is attached and a single employee row is selected, auto-populate
    // that employee's quantity (hours) and amount based on fetchedTasks.
    useEffect(() => {
        try {
            const selectedRows = (invoiceEmployees || []).filter(e => e.userId);
            if (!attachTimesheet || !fetchedTasks || fetchedTasks.length === 0 || selectedRows.length !== 1) return;

            // Calculate total minutes from fetched tasks
            let totalMinutes = 0;
            fetchedTasks.forEach(task => {
                totalMinutes += (task.hoursSpent || 0) * 60 + (task.minutesSpent || 0);
            });

            const totalHoursDecimal = totalMinutes / 60;
            const quantity = Math.floor(totalHoursDecimal); // use integer hours for quantity

            setInvoiceEmployees(prev => prev.map(e => {
                if (!e.userId) return e;
                const rate = parseFloat(e.rate) || 0;
                const amount = parseFloat((rate * quantity).toFixed(2));
                return { ...e, quantity: quantity, amount: amount };
            }));

            // Also populate top-level hoursSpent so preview/submit use correct value
            setFormData(prev => ({ ...prev, hoursSpent: totalHoursDecimal.toFixed(2) }));
        } catch (err) {
            console.error('Failed to auto-calc employee amount from timesheet:', err);
        }
    }, [attachTimesheet, fetchedTasks]);

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
        // Allow empty items or employees tables, but require combined table total > 0
        const combinedTotal = parseFloat(computeItemsTotal()) || 0;
        if (combinedTotal <= 0) newErrors.items = 'At least one item or employee row must have a non-zero amount';

        // Make fromDate, toDate and hours optional in the new form.
        // Only validate date range when both dates are provided.
        if (formData.fromDate && formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate)) {
            newErrors.toDate = 'To date must be after from date';
        }

        // Validate character limits
        if (formData.billToAddress && formData.billToAddress.length > 500) {
            newErrors.billToAddress = 'Bill To address cannot exceed 500 characters';
        }
        if (formData.shipToAddress && formData.shipToAddress.length > 500) {
            newErrors.shipToAddress = 'Ship To address cannot exceed 500 characters';
        }
        if (formData.customerInfo && formData.customerInfo.length > 200) {
            newErrors.customerInfo = 'Customer info cannot exceed 200 characters';
        }
        if (formData.supplierAddress && formData.supplierAddress.length > 500) {
            newErrors.supplierAddress = 'Supplier address cannot exceed 500 characters';
        }
        if (formData.supplierInfo && formData.supplierInfo.length > 200) {
            newErrors.supplierInfo = 'Supplier info cannot exceed 200 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        console.log('handleSubmit called');
        
        // Run validation
        const newErrors = {};
        if (!formData.customerName?.trim()) newErrors.customerName = 'Customer name is required';
        if (!formData.supplierName?.trim()) newErrors.supplierName = 'Supplier name is required';
        const combinedTotal = parseFloat(computeItemsTotal()) || 0;
        if (combinedTotal <= 0) newErrors.items = 'At least one item or employee row must have a non-zero amount';
        if (formData.fromDate && formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate)) {
            newErrors.toDate = 'To date must be after from date';
        }
        if (formData.billToAddress && formData.billToAddress.length > 500) {
            newErrors.billToAddress = 'Bill To address cannot exceed 500 characters';
        }
        if (formData.shipToAddress && formData.shipToAddress.length > 500) {
            newErrors.shipToAddress = 'Ship To address cannot exceed 500 characters';
        }
        if (formData.customerInfo && formData.customerInfo.length > 200) {
            newErrors.customerInfo = 'Customer info cannot exceed 200 characters';
        }
        if (formData.supplierAddress && formData.supplierAddress.length > 500) {
            newErrors.supplierAddress = 'Supplier address cannot exceed 500 characters';
        }
        if (formData.supplierInfo && formData.supplierInfo.length > 200) {
            newErrors.supplierInfo = 'Supplier info cannot exceed 200 characters';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Build a more specific error message
            const errorMessages = Object.values(newErrors);
            const errorMessage = `Please fix the following errors:\n${errorMessages.join('\n')}`;
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
            return;
        }
        
        // Clear any previous errors
        setErrors({});

        setLoading(true);
        try {
            

            // Normalize numeric fields to avoid null/NaN being sent to backend
            const parsedRate = parseFloat(formData.rate);
            let rateValue = Number.isFinite(parsedRate) ? parsedRate : null;
            const parsedHours = parseFloat(formData.hoursSpent);
            let hoursValue = Number.isFinite(parsedHours) ? parsedHours : null;

            const itemsToSend = (items || []).map(it => ({
                itemDesc: it.itemDesc || it.description || '',
                rate: Number.isFinite(parseFloat(it.rate)) ? parseFloat(it.rate) : 0,
                quantity: Number.isFinite(parseFloat(it.quantity)) ? parseFloat(it.quantity) : 0,
                amount: Number.isFinite(parseFloat(it.amount)) ? parseFloat(it.amount) : 0,
                remarks: it.remarks || ''
            }));

            const invoiceEmpRows = (invoiceEmployees || []).filter(e => e.userId);
            const employeesToSend = invoiceEmpRows.map(e => ({
                itemDesc: e.itemDesc || (employees.find(emp => emp.userId === e.userId)?.label) || '',
                rate: Number.isFinite(parseFloat(e.rate)) ? parseFloat(e.rate) : 0,
                quantity: Number.isFinite(parseFloat(e.quantity)) ? parseFloat(e.quantity) : 0,
                amount: Number.isFinite(parseFloat(e.amount)) ? parseFloat(e.amount) : 0,
                remarks: e.remarks || ''
            }));

            // Derive sensible fallbacks for rate and hours if missing
            if ((!rateValue || rateValue <= 0) && employeesToSend.length === 1 && employeesToSend[0].rate > 0) {
                rateValue = employeesToSend[0].rate;
            }
            if ((!rateValue || rateValue <= 0) && itemsToSend.length > 0 && itemsToSend[0].rate > 0) {
                rateValue = itemsToSend[0].rate;
            }
            // If still missing, try compute from totalAmount/hours
            const tableTotal = items && items.length ? parseFloat(computeItemsTotal()) : null;
            if ((!rateValue || rateValue <= 0) && tableTotal && Number.isFinite(hoursValue) && hoursValue > 0) {
                rateValue = tableTotal / hoursValue;
            }
            // Minimum fallback to satisfy backend DecimalMin
            if (!rateValue || rateValue <= 0) {
                rateValue = 0.01;
            }

            // Hours fallback: sum of employee quantities (treated as hours) or default 1
            if ((!hoursValue || hoursValue <= 0) && employeesToSend.length > 0) {
                const sumHours = employeesToSend.reduce((s, ee) => s + (Number.isFinite(parseFloat(ee.quantity)) ? parseFloat(ee.quantity) : 0), 0);
                if (sumHours > 0) hoursValue = sumHours;
            }
            if (!hoursValue || hoursValue <= 0) {
                hoursValue = 1;
            }

            // Compute top-level employeeName to satisfy DB non-null constraints
            const topEmployeeName = formData.employeeName || (invoiceEmpRows.length === 1 ? (employees.find(emp => emp.userId === invoiceEmpRows[0].userId)?.name || '') : '');

            const invoiceData = {
                invoiceName: formData.invoiceName,
                invoiceType: formData.invoiceType,
                invoiceDate: formData.invoiceDate,
                taxId: formData.taxId,
                billPeriod: formData.billPeriod,
                customerName: formData.customerName,
                billToAddress: formData.billToAddress || "",
                shipToAddress: formData.shipToAddress || "",
                customerInfo: formData.customerInfo || "",
                supplierName: formData.supplierName,
                supplierAddress: formData.supplierAddress || "",
                supplierInfo: formData.supplierInfo || "",
                items: itemsToSend,
                employees: employeesToSend,
                // ensure non-null employeeName for backend
                employeeName: topEmployeeName,
                employeeNames: formData.employeeNames && formData.employeeNames.length ? formData.employeeNames : null,
                currency: (formData.currency || "USD").toUpperCase(),
                country: formData.country || null,
                fromDate: formData.fromDate || new Date().toISOString().split('T')[0],
                toDate: formData.toDate || (formData.fromDate || new Date().toISOString().split('T')[0]),
                hoursSpent: hoursValue,
                totalAmount: tableTotal !== null ? tableTotal : (formData.totalAmount ? parseFloat(formData.totalAmount) : (rateValue * hoursValue)),
                remarks: formData.remarks || "",
                projectName: formData.projectName || "",
                // Include timesheet data if checkbox is checked AND invoice has a single employee selected
                timesheetData: (attachTimesheet && (invoiceEmployees || []).filter(e => e.userId).length === 1) ? prepareTimesheetData() : null
            };
            // Set top-level rate (required by backend)
            invoiceData.rate = rateValue;
            console.log('Submitting invoice data:', invoiceData);
            setSnackbar({ open: true, message: 'Submitting invoice...', severity: 'info' });

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

            console.log(isFromInvoiceManagement ? 'Invoice saved successfully:' : 'Invoice generated successfully:', response.data);
            setSnackbar((prev) => ({
                ...prev,
                open: true,
                message: isFromInvoiceManagement ? "Invoice Saved Successfully" : "PO Consumption Created Successfully",
                severity: "success",
            }))


            // Call parent's onSubmit if provided
            if (onSubmit) {
                onSubmit(response.data);
            }

            // Ask user if they want to download the PDF only when NOT from invoice management
            if (!isFromInvoiceManagement && response.data.invoiceId) {
                setTimeout(() => {
                    handleDownloadInvoice(response.data.invoiceId, response.data.invoiceName);
                }, 500);
            }

            // clear draft and reset
            try { sessionStorage.removeItem('addInvoiceDraft'); } catch { /* ignore */ }
            handleReset();
            onClose();

        } catch (error) {
            console.error('Error creating invoice:', error);

            let errorMessage = isFromInvoiceManagement ? 'Failed to save invoice. Please try again.' : 'Failed to create invoice. Please try again.';
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
            // Build preview payload with same required fallbacks as submit
            const parsedRate = parseFloat(formData.rate);
            let rateValue = Number.isFinite(parsedRate) ? parsedRate : null;
            const parsedHours = parseFloat(formData.hoursSpent);
            let hoursValue = Number.isFinite(parsedHours) ? parsedHours : null;

            const itemsToSend = (items || []).map(it => ({
                itemDesc: it.itemDesc || it.description || '',
                rate: Number.isFinite(parseFloat(it.rate)) ? parseFloat(it.rate) : 0,
                quantity: Number.isFinite(parseFloat(it.quantity)) ? parseFloat(it.quantity) : 0,
                amount: Number.isFinite(parseFloat(it.amount)) ? parseFloat(it.amount) : 0,
                remarks: it.remarks || ''
            }));

            const invoiceEmpRows = (invoiceEmployees || []).filter(e => e.userId);
            const employeesToSend = invoiceEmpRows.map(e => ({
                itemDesc: e.itemDesc || (employees.find(emp => emp.userId === e.userId)?.label) || '',
                rate: Number.isFinite(parseFloat(e.rate)) ? parseFloat(e.rate) : 0,
                quantity: Number.isFinite(parseFloat(e.quantity)) ? parseFloat(e.quantity) : 0,
                amount: Number.isFinite(parseFloat(e.amount)) ? parseFloat(e.amount) : 0,
                remarks: e.remarks || ''
            }));

            // derive rate/hours similar to submit
            if ((!rateValue || rateValue <= 0) && employeesToSend.length === 1 && employeesToSend[0].rate > 0) {
                rateValue = employeesToSend[0].rate;
            }
            if ((!rateValue || rateValue <= 0) && itemsToSend.length > 0 && itemsToSend[0].rate > 0) {
                rateValue = itemsToSend[0].rate;
            }
            const computedTableTotal = items && items.length ? parseFloat(computeItemsTotal()) : null;
            if ((!rateValue || rateValue <= 0) && computedTableTotal && Number.isFinite(hoursValue) && hoursValue > 0) {
                rateValue = computedTableTotal / hoursValue;
            }
            if (!rateValue || rateValue <= 0) rateValue = 0.01;
            if ((!hoursValue || hoursValue <= 0) && employeesToSend.length > 0) {
                const sumHours = employeesToSend.reduce((s, ee) => s + (Number.isFinite(parseFloat(ee.quantity)) ? parseFloat(ee.quantity) : 0), 0);
                if (sumHours > 0) hoursValue = sumHours;
            }
            if (!hoursValue || hoursValue <= 0) hoursValue = 1;

            const today = new Date().toISOString().split('T')[0];
            const fromDateToSend = formData.fromDate || today;
            const toDateToSend = formData.toDate || fromDateToSend;

            const topEmployeeName = formData.employeeName || (invoiceEmpRows.length === 1 ? (employees.find(emp => emp.userId === invoiceEmpRows[0].userId)?.name || '') : '');

            const invoiceData = {
                invoiceName: formData.invoiceName || "",
                invoiceType: formData.invoiceType,
                invoiceDate: formData.invoiceDate || "",
                taxId: formData.taxId || "",
                billPeriod: formData.billPeriod || "",
                customerName: formData.customerName || "",
                billToAddress: formData.billToAddress || "",
                shipToAddress: formData.shipToAddress || "",
                customerInfo: formData.customerInfo || "",
                supplierName: formData.supplierName || "",
                supplierAddress: formData.supplierAddress || "",
                supplierInfo: formData.supplierInfo || "",
                items: itemsToSend,
                employees: employeesToSend,
                employeeName: topEmployeeName || "",
                employeeNames: formData.employeeNames && formData.employeeNames.length ? formData.employeeNames : null,
                rate: rateValue,
                currency: (formData.currency || "USD").toUpperCase(),
                country: formData.country || null,
                fromDate: fromDateToSend,
                toDate: toDateToSend,
                hoursSpent: hoursValue,
                totalAmount: computedTableTotal !== null ? computedTableTotal : (formData.totalAmount ? parseFloat(formData.totalAmount) : (rateValue * hoursValue)),
                remarks: formData.remarks || "",
                projectName: formData.projectName || "",
                timesheetData: (attachTimesheet && invoiceEmpRows.length === 1) ? prepareTimesheetData() : null
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
            billToAddress: '',
            shipToAddress: '',
            customerInfo: '',
            supplierName: sessionStorage.getItem('tenantName') || '',
            supplierAddress: '',
            supplierInfo: '',
            employeeName: '',
            employeeNames: [],
            employeeIds: [],
            rate: '',
            currency: 'USD',
            fromDate: '',
            toDate: '',
            hoursSpent: '',
            totalAmount: '',
            remarks: '',
            projectName: '',
            employeeId: ''
        });
        setErrors({});
        setAttachments([]);
        setAttachTimesheet(false);
        setFetchedTasks([]);
        setItems([{ id: 1, description: '', rate: '', quantity: '', amount: '', remarks: '' }]);
        setInvoiceEmployees([{ id: 1, userId: '', rate: '', quantity: '', amount: '', remarks: '' }]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // clear saved draft
        try { sessionStorage.removeItem('addInvoiceDraft'); } catch { /* ignore */ }
    };

    const handleCloseModal = () => {
        try { sessionStorage.removeItem('addInvoiceDraft'); } catch { /* ignore */ }
        handleReset();
        if (onClose) onClose();
    };

    const getDisplayTotal = () => {
        if (isCalculating) return 'Calculating...';
        // Prefer table total if items are present
        if (items && items.length > 0) {
            const total = computeItemsTotal();
            const symbol = currencySymbols[formData.currency] || '$';
            return `${symbol}${parseFloat(total || 0).toLocaleString()}`;
        }
        if (formData.totalAmount) {
            const symbol = currencySymbols[formData.currency] || '$';
            return `${symbol}${parseFloat(formData.totalAmount).toLocaleString()}`;
        }
        return `${currencySymbols[formData.currency] || '$'}0.00`;
    };

    const amountToWords = (amountValue, currency) => {
        if (amountValue === null || amountValue === undefined) return '';
        const cleaned = (typeof amountValue === 'string') ? amountValue.replace(/[^0-9.-]/g, '') : String(amountValue);
        const parsed = parseFloat(cleaned);
        if (isNaN(parsed)) return '';
        const units = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
        const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

        const numberToWords = (n) => {
            if (n === 0) return 'Zero';
            if (n < 20) return units[n];
            if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + units[n%10] : '');
            if (n < 1000) return units[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + numberToWords(n%100) : '');
            if (n < 1000000) return numberToWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + numberToWords(n%1000) : '');
            if (n < 1000000000) return numberToWords(Math.floor(n/1000000)) + ' Million' + (n%1000000 ? ' ' + numberToWords(n%1000000) : '');
            return numberToWords(Math.floor(n/1000000000)) + ' Billion' + (n%1000000000 ? ' ' + numberToWords(n%1000000000) : '');
        };

        const major = {
            USD: ['Dollar','Cent'],
            INR: ['Rupee','Paise'],
            EUR: ['Euro','Cent'],
            GBP: ['Pound','Pence'],
            JPY: ['Yen','Sen'],
            CAD: ['Dollar','Cent'],
            AUD: ['Dollar','Cent']
        };

        const amt = parsed || 0;
        const whole = Math.floor(Math.abs(amt));
        const fraction = Math.round((Math.abs(amt) - whole) * 100);
        const majorName = (major[currency] && major[currency][0]) || 'Currency';
        const minorName = (major[currency] && major[currency][1]) || 'Cents';

        let words = numberToWords(whole) + ' ' + (whole === 1 ? majorName : (majorName + 's'));
        if (fraction > 0) {
            words += ' and ' + numberToWords(fraction) + ' ' + (fraction === 1 ? minorName : (minorName));
        }
        return words;
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
                                <h2 className="text-base sm:text-lg lg:text-xl font-bold">Add New Invoice</h2>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Tenant logo or initials on top-right */}
                            <div className="flex items-center space-x-3">
                                {(() => {
                                    const logoUrl = sessionStorage.getItem('tenantLogoUrl');
                                    const tenantName = sessionStorage.getItem('tenantName') || '';
                                    if (logoUrl) {
                                        return <img src={logoUrl} alt="tenant-logo" className="w-10 h-10 rounded-md object-cover" />
                                    }
                                    const initials = tenantName ? (tenantName.trim().charAt(0).toUpperCase() + tenantName.trim().slice(-1).toUpperCase()) : 'TN';
                                    return (
                                        <div className="w-10 h-10 bg-white text-green-700 font-bold rounded-md flex items-center justify-center border">
                                            {initials}
                                        </div>
                                    )
                                })()}
                            </div>

                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-green-700 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
                    <div className="space-y-6">
                        {/* 1st Line: Invoice ID, Invoice Name, and Project Name */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                                <span className="text-red-700 text-sm">{errors.submit}</span>
                            </div>
                        )}
                        {/* New layout per spec */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice ID</label>
                                <input type="text" disabled value={generatePreviewInvoiceId()} className="w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                                <OrganizationSelect
                                    value={formData.supplierName || ''}
                                    onChange={(value) => setFormData(prev => ({ ...prev, supplierName: value }))}
                                    onOrgSelect={handleSupplierOrgSelect}
                                    placeholder="Search for supplier or type new..."
                                    orgType="SUPPLIER"
                                    isDisabled={loadingEmployees}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type</label>
                                <select value={formData.invoiceType} onChange={handleChange('invoiceType')} className="w-full h-10 px-4 border border-gray-300 rounded-md">
                                    <option value="DOMESTIC">Domestic</option>
                                    <option value="INTERNATIONAL">International</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Name</label>
                                <input type="text" placeholder="Enter invoice name (optional)" value={formData.invoiceName} onChange={handleChange('invoiceName')} className="w-full h-10 px-4 border rounded-md" maxLength={100} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Initiative name</label>
                                <Select
                                    options={projectOptions}
                                    value={projectOptions.find(o => o.value === formData.projectName) || null}
                                    onChange={(opt) => setFormData(prev => ({ ...prev, projectName: opt ? opt.value : '' }))}
                                    isClearable
                                    isSearchable
                                    classNamePrefix="react-select"
                                    menuPlacement="auto"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Address</label>
                                <input type="text" placeholder="Enter supplier address" value={formData.supplierAddress} onChange={handleChange('supplierAddress')} className="w-full h-10 px-4 border rounded-md" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
                                <input type="date" value={formData.invoiceDate} onChange={handleChange('invoiceDate')} className="w-full h-10 px-4 border rounded-md" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                                <input type="text" placeholder="Enter tax id" value={formData.taxId} onChange={handleChange('taxId')} className="w-full h-10 px-4 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                            <OrganizationSelect
                                value={formData.customerName || ''}
                                onChange={(value) => setFormData(prev => ({ ...prev, customerName: value }))}
                                onOrgSelect={handleCustomerOrgSelect}
                                placeholder="Search for customer or type new..."
                                orgType="CUSTOMER"
                                isDisabled={loadingEmployees}
                                className="w-full"
                            />
                            </div>
                        </div>

                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Bill Period</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-600">From</label>
                                                <input type="date" value={formData.fromDate} onChange={handleChange('fromDate')} className="w-full h-10 px-4 border rounded-md" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">To</label>
                                                <input type="date" value={formData.toDate} onChange={handleChange('toDate')} className="w-full h-10 px-4 border rounded-md" />
                                            </div>
                                        </div>
                                    </div>

                        {/* Currency select moved into the Invoice Items table header */}

                        <div className="mt-3 grid grid-cols-1">
                            
                        </div>

                        {/* Customer address fields - vary by invoice type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bill To Address</label>
                                {formData.invoiceType === 'DOMESTIC' ? (
                                    <input type="text" placeholder="Bill to address" value={formData.billToAddress} onChange={handleChange('billToAddress')} className="w-full h-10 px-4 border rounded-md" />
                                ) : (
                                    <input type="text" placeholder="Customer address (international)" value={formData.customerInfo} onChange={handleChange('customerInfo')} className="w-full h-10 px-4 border rounded-md" />
                                )}
                            </div>

                            {formData.invoiceType === 'DOMESTIC' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ship To Address</label>
                                    <input type="text" placeholder="Ship to address" value={formData.shipToAddress} onChange={handleChange('shipToAddress')} className="w-full h-10 px-4 border rounded-md" />
                                </div>
                            )}

                        </div>

                        {/* 3rd Line: Supplier Name and Supplier Address */}
                        

                        

                        {/* 5th Line: Employee Name, Currency, Rate, Hours Spent */}


                        {/* 6th Line: From Date and To Date */}
                          {/* Total Amount Display */}
                        {/* Editable Items / Employees Table */}
                        <div className="border border-gray-200 rounded-md p-3 bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold">Invoice Items</h3>
                                <div className="flex items-center space-x-2">
                                    <select value={formData.currency} onChange={handleChange('currency')} className="h-8 px-2 border rounded-md text-sm">
                                        <option value="USD">USD ($)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="JPY">JPY (¥)</option>
                                        <option value="CAD">CAD (C$)</option>
                                        <option value="AUD">AUD (A$)</option>
                                    </select>
                                    <button type="button" onClick={() => {
                                        // rename headers example placeholder (no-op)
                                    }} className="text-xs text-gray-500">Edit headers</button>
                                </div>
                            </div>

                            {/* editable headers */}
                            <div className="grid grid-cols-5 gap-0 mb-2">
                                <input value={tableHeaders.col1} onChange={(e) => updateTableHeader('col1', e.target.value)} className="px-2 py-1 border rounded-none" />
                                <input value={tableHeaders.col2} onChange={(e) => updateTableHeader('col2', e.target.value)} className="px-2 py-1 border rounded-none" />
                                <input value={tableHeaders.col3} onChange={(e) => updateTableHeader('col3', e.target.value)} className="px-2 py-1 border rounded-none" />
                                <input value={tableHeaders.col4} onChange={(e) => updateTableHeader('col4', e.target.value)} className="px-2 py-1 border rounded-none" />
                                <input value={tableHeaders.col5} onChange={(e) => updateTableHeader('col5', e.target.value)} className="px-2 py-1 border rounded-none" />
                            </div>

                            {/* Items rows */}
                            <div className="space-y-2">
                                {items.map((it) => (
                                    <div key={it.id} className="grid grid-cols-5 gap-0 items-center">
                                        <input placeholder="Description" value={it.description} onChange={(e) => updateItemField(it.id, 'description', e.target.value)} className="px-2 py-1 border rounded-none" />
                                        <input placeholder="Rate" value={it.rate} onChange={(e) => updateItemField(it.id, 'rate', e.target.value.replace(/[^0-9.]/g, ''))} className="px-2 py-1 border rounded-none" />
                                        <input placeholder="Qty" value={it.quantity} onChange={(e) => updateItemField(it.id, 'quantity', e.target.value.replace(/[^0-9.]/g, ''))} className="px-2 py-1 border rounded-none" />
                                        <input placeholder="Amount" value={it.amount} readOnly className="px-2 py-1 border rounded-none bg-gray-50" />
                                        <div className="flex items-center">
                                            <input placeholder="Remarks" value={it.remarks} onChange={(e) => updateItemField(it.id, 'remarks', e.target.value)} className="px-2 py-1 border rounded-none flex-1" />
                                            <button type="button" onClick={() => removeItem(it.id)} className="text-red-500 px-2" title="Delete item"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={addItem} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">Add Item</button>
                            </div>

                            {/* Employee selection rows */}
                            <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Employees</h4>
                                <div className="space-y-2">
                                    {invoiceEmployees.map((er) => (
                                        <div key={er.id} className="grid grid-cols-5 gap-0 items-center">
                                            <div>
                                                <CreatableSelect
                                                    options={employees}
                                                    value={employees.find(emp => emp.userId === er.userId) || null}
                                                    onChange={(opt) => updateEmployeeRow(er.id, 'userId', opt ? opt.userId : '')}
                                                    classNamePrefix="react-select"
                                                    isClearable
                                                />
                                            </div>
                                            <div>
                                                <input value={er.rate} onChange={(e) => updateEmployeeRow(er.id, 'rate', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Rate" className="px-2 py-1 border rounded-none w-full" />
                                            </div>
                                            <div>
                                                <input value={er.quantity} onChange={(e) => updateEmployeeRow(er.id, 'quantity', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Qty" className="px-2 py-1 border rounded-none w-full" />
                                            </div>
                                            <div>
                                                <input value={er.amount} readOnly placeholder="Amount" className="px-2 py-1 border rounded-none bg-gray-50 w-full" />
                                            </div>
                                            <div className="flex items-center">
                                                <input value={er.remarks} onChange={(e) => updateEmployeeRow(er.id, 'remarks', e.target.value)} placeholder="Remarks" className="px-2 py-1 border rounded-none flex-1" />
                                                <button type="button" onClick={() => removeEmployeeRow(er.id)} className="text-red-500 px-2" title="Delete employee"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button type="button" onClick={addEmployeeRow} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">Add Employee</button>
                                </div>
                            </div>

                            {/* Table totals and amount in words */}
                            <div className="mt-4 text-right">
                                                    <div className="text-lg font-semibold">Table Total: {currencySymbols[formData.currency] || '$'}{computeItemsTotal()}</div>
                                                    <div className="text-sm italic mt-1">In words: {amountToWords(parseFloat(computeItemsTotal() || 0), formData.currency)}</div>
                                                </div>
                            {errors.items && (
                                <div className="mt-2 text-sm text-red-600">{errors.items}</div>
                            )}
                            {/* Timesheet checkbox moved below table */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id="attachTimesheet"
                                        checked={attachTimesheet}
                                        onChange={(e) => setAttachTimesheet(e.target.checked)}
                                        disabled={(invoiceEmployees || []).filter(e => e.userId).length > 1}
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
                                        {(invoiceEmployees || []).filter(e => e.userId).length > 1 && (
                                            <p className="text-xs text-red-600 mt-1">Timesheet will not be included when multiple employees are selected</p>
                                        )}
                                    </div>
                                </div>

                                {/* Timesheet Summary (when timesheet is attached) */}
                                {attachTimesheet && (
                                    <div className="mt-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <label className="text-xs text-gray-700">From</label>
                                                <input type="date" value={formData.fromDate} onChange={handleChange('fromDate')} className="w-full h-8 px-2 border rounded-md" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-700">To</label>
                                                <input type="date" value={formData.toDate} onChange={handleChange('toDate')} className="w-full h-8 px-2 border rounded-md" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={async () => {
                                                // fetch timesheet refs for selected single employee
                                                const selectedRows = (invoiceEmployees || []).filter(e => e.userId);
                                                if (!formData.fromDate || !formData.toDate) {
                                                    setSnackbar({ open: true, message: 'Please select from and to dates in Bill Period', severity: 'error' });
                                                    return;
                                                }
                                                if (selectedRows.length === 0) {
                                                    setSnackbar({ open: true, message: 'Please select an employee row to fetch timesheet for', severity: 'error' });
                                                    return;
                                                }
                                                if (selectedRows.length > 1) {
                                                    setSnackbar({ open: true, message: 'Timesheet auto-fill only available for a single employee', severity: 'error' });
                                                    return;
                                                }
                                                const empId = selectedRows[0].userId;
                                                try {
                                                    const res = await axios.get(`${API_BASE_URL}/api/timesheet-tasks/admin-between`, {
                                                        params: {
                                                            start: formData.fromDate,
                                                            end: formData.toDate,
                                                            userId: empId
                                                        },
                                                        headers: { Authorization: sessionStorage.getItem('token') }
                                                    });
                                                    const tasks = res.data || [];
                                                    setFetchedTasks(tasks);
                                                    // compute total minutes
                                                    let totalMinutes = 0;
                                                    tasks.forEach(task => {
                                                        totalMinutes += (task.hoursSpent || 0) * 60 + (task.minutesSpent || 0);
                                                    });
                                                    const hours = Math.floor(totalMinutes / 60);
                                                    const minutes = totalMinutes % 60;
                                                    const decimalHours = parseFloat((hours + minutes / 60).toFixed(2));
                                                    // set a simple timesheet ref
                                                    const genRef = `TS-${empId}-${formData.fromDate.replace(/-/g,'')}-${formData.toDate.replace(/-/g,'')}`;
                                                    setTimesheetRef(genRef);
                                                    setSnackbar({ open: true, message: `Timesheet fetched (${tasks.length} entries). Ref: ${genRef}`, severity: 'success' });
                                                    // auto-fill the single employee row's quantity and rate
                                                    const empObj = employees.find(e => e.userId === empId);
                                                    setInvoiceEmployees(prev => prev.map(e => e.userId === empId ? ({ ...e, quantity: decimalHours, rate: empObj ? (empObj.cost || empObj.cost === 0 ? empObj.cost : '') : e.rate }) : e));
                                                } catch (err) {
                                                    console.error('Error fetching timesheet tasks:', err);
                                                    setSnackbar({ open: true, message: 'Failed to fetch timesheet data', severity: 'error' });
                                                }
                                            }} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">Get Timesheet Ref</button>
                                            {timesheetRef && (
                                                <div className="text-sm text-gray-700">
                                                    <div>Ref: {timesheetRef}</div>
                                                    <div className="text-sm italic mt-1">In words: {amountToWords(parseFloat(computeItemsTotal() || 0), formData.currency)}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                                <p className="text-blue-800">{employee?.name || ''}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-blue-600 mt-2">
                                            ✓ Detailed timesheet table will be included in the generated PDF
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

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
                            {/** Amount in words */}
                            <div className="mt-2">
                                <p className="text-sm text-gray-700 italic">In words: {amountToWords(parseFloat(computeItemsTotal() || formData.totalAmount || 0), formData.currency)}</p>
                            </div>
                            {formData.rate && formData.hoursSpent && (
                                <p className="text-sm text-gray-600 mt-2">
                                    {currencySymbols[formData.currency]}{formData.rate} × {formData.hoursSpent} hours = {getDisplayTotal()}
                                </p>
                            )}
                        </div>

                        {/* Project */}
                       
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none break-words overflow-wrap-anywhere whitespace-pre-wrap"
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
                            <p className="text-lg font-medium text-gray-900">
                                {isFromInvoiceManagement ? 'Saving Invoice...' : 'Generating Invoice...'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {isFromInvoiceManagement 
                                    ? 'Please wait while we save your invoice'
                                    : (attachTimesheet
                                        ? `Including ${viewMode?.toLowerCase() || ''} timesheet data...`
                                        : attachments.length > 0
                                            ? `Processing ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}...`
                                            : 'Please wait while we create your invoice'
                                    )
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* Visual footer details (tenant info for PDF footer preview) */}
                <div className="px-6 pt-4 pb-2 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                        <div>
                            <div className="font-semibold">{sessionStorage.getItem('tenantName') || ''}</div>
                            <div>{sessionStorage.getItem('tenantEmail') || ''} • {sessionStorage.getItem('tenantContact') || ''}</div>
                            <div className="text-xs text-gray-500">{sessionStorage.getItem('tenantMailingAddress') || ''}</div>
                        </div>
                        <div className="text-right text-xs text-gray-500">Page 1 of 1</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 px-6 pb-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleCloseModal}
                        disabled={loading}
                        className="px-6 py-2 border border-green-700 text-green-700 rounded-md hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    
                    {/* Show Preview and Generate Invoice buttons only when NOT from invoice management */}
                    {!isFromInvoiceManagement && (
                        <button
                            onClick={handleInvoicePreview}
                            disabled={loading}
                            className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50"
                        >
                            Preview
                        </button>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {isFromInvoiceManagement ? 'Saving...' : (attachTimesheet ? 'Including Timesheet...' : attachments.length > 0 ? 'Uploading...' : 'Generating...')}
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2" size={16} />
                                {isFromInvoiceManagement ? 'Save Invoice' : 'Generate Invoice'}
                                {!isFromInvoiceManagement && (attachments.length > 0 || attachTimesheet) && (
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