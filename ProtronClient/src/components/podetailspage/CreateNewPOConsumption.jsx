import { useState, useEffect } from 'react'
import { X, Calendar, Folder, User, Building, DollarSign, FileText, Activity, Hash, MessageSquare, Upload, AlertCircle } from "lucide-react"
import axios from 'axios'
import CreatableSelect from "react-select/creatable"
import { useSession } from '../../Context/SessionContext'
import GlobalSnackbar from '../GlobalSnackbar'

const getCurrencySymbol = (currency) => {
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CAD': 'C$',
        'CHF': 'CHF',
        'CNY': '¥',
        'SEK': 'kr',
        'NZD': 'NZ$'
    };
    
    return currencySymbols[currency] || currency;
};
const CreateNewPOConsumption = ({ open, onClose, poNumber, poId }) => {
    if (!open) return null
    console.log(poId)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [po, setPo] = useState([])
    const [formData, setFormData] = useState({
        poNumber: poNumber,
        msId: "",
        amount: "",
        currency: po.poCurrency || "USD",
        utilizationType: "Fixed",
        resource: "",
        project: "",
        workDesc: "",
        workAssignDate: "",
        workCompletionDate: "",
        remarks: "",
        systemName: ""
    });
    const [milestones, setMilestones] = useState([])
    const [users, setUsers] = useState([])
    const [projectList, setProjectList] = useState([])
    const [poConsumptionFiles, setPoConsumptionFiles] = useState([])
    const [poBalance, setPOBalance] = useState(null)
    const [milestoneBalance, setMilestoneBalance] = useState(null)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: ''
    })
    const removePOConsumptionFile = async (index) => {
        const fileToDelete = poConsumptionFiles[index];
        const token = sessionStorage.getItem("token");
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/po-attachments/delete`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ fileName: fileToDelete.name }),
                }
            );

            if (response.ok) {
                console.log(`Attachment ${fileToDelete.name} deleted successfully.`);
                setPoConsumptionFiles((prev) => prev.filter((_, i) => i !== index));
            } else {
                console.error(`Failed to delete attachment: ${fileToDelete.name}`);
            }
        } catch (error) {
            console.error(`Error deleting attachment: ${fileToDelete.name}`, error);
        }
    };

    const resourceOptions = users.map((user) => ({
        value: user.name,
        label: user.name.length > 25 ? `${user.name.substring(0, 25)}...` : user.name,
    }));
    
    const projectOptions = projectList.map((project) => ({
        value: project.projectName,
        label: project.projectName
    }))

    const fetchPODetails = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/po/${poId}`, {
                headers: {
                    Authorization: sessionStorage.getItem("token")
                }
            })
            console.log("PO: ", res.data)
            console.log("Currency: ", res.data.poCurrency)
            setPo(res.data)
            setFormData(prev => ({
                ...prev,
                currency: res.data.poCurrency || "USD"
            }));
        } catch (error) {
            console.log(error)
        }
    }

    const fetchMilestones = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/po-milestone/po/${poId}`,
                {
                    headers: {
                        Authorization: sessionStorage.getItem("token")
                    }
                }
            )
            console.log("Milestones: ", res.data)
            setMilestones(res.data)
        }
        catch (error) {
            console.log(error)
        }
    }

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const tenantId = sessionStorage.getItem('tenantId');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/users`, {
                headers: { Authorization: `${token}` }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const tenantId = sessionStorage.getItem('tenantId');
            const token = sessionStorage.getItem('token');
            const projectResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/tenants/${tenantId}/projects`,
                {
                    headers: { Authorization: `${token}` }
                }
            );
            setProjectList(projectResponse.data);
            console.log('Projects fetched:', projectResponse.data);
        }
        catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        const fetchPOBalance = async () => {
            if (poId) {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/po/pobalance-con/${poId}`,
                        { headers: { Authorization: `${token}` } }
                    );
                    setPOBalance(response.data);
                } catch (error) {
                    console.error("Error fetching PO balance:", error);
                }
            }
        };

        const fetchMilestoneBalance = async () => {
            if (poId && formData.msId) {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/po-milestone/milestonebalance-consumption/${poId}/${formData.msId}`,
                        { headers: { Authorization: `${token}` } }
                    );
                    setMilestoneBalance(response.data);
                } catch (error) {
                    console.error("Error fetching milestone balance:", error);
                }
            } else {
                setMilestoneBalance(null); // Reset when no milestone selected
            }
        };

        fetchPOBalance();
        fetchMilestoneBalance();
    }, [poId, formData.msId]);

    useEffect(() => {
        fetchUsers();
    }, []);
    useEffect(() => {
        fetchProjects();
    }, []);
    useEffect(() => {
        if (poNumber) {
            fetchPODetails()
        }
    }, [poNumber])
    useEffect(() => {
        if (poId) {
            fetchMilestones()
        }
    }, [poId])

    // Enhanced validation function with balance check
    const validateForm = () => {
    const newErrors = {}

    if (!formData.amount || formData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0'
    } else {
        // Check balance validation
        const enteredAmount = parseFloat(formData.amount);
        const availableBalance = milestoneBalance !== null ? milestoneBalance : poBalance;
        
        if (availableBalance !== null && enteredAmount > availableBalance) {
            const balanceType = milestoneBalance !== null ? 'milestone' : 'PO';
            const currencySymbol = getCurrencySymbol(formData.currency);
            
            newErrors.amount = `Amount exceeds available ${balanceType} balance of ${currencySymbol}${availableBalance.toLocaleString()}. Please enter an amount within the available balance.`;
        }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
}
    // Real-time amount validation
    // Updated handleAmountChange function
const handleAmountChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, amount: value });
    
    // Clear previous amount error
    if (errors.amount) {
        setErrors(prev => ({
            ...prev,
            amount: ""
        }));
    }
    
    // Real-time validation
    if (value && parseFloat(value) > 0) {
        const enteredAmount = parseFloat(value);
        const availableBalance = milestoneBalance !== null ? milestoneBalance : poBalance;
        
        if (availableBalance !== null && enteredAmount > availableBalance) {
            const balanceType = milestoneBalance !== null ? 'milestone' : 'PO';
            const currencySymbol = getCurrencySymbol(formData.currency);
            
            setErrors(prev => ({
                ...prev,
                amount: `Amount exceeds available ${balanceType} balance of ${currencySymbol}${availableBalance.toLocaleString()}`
            }));
        }
    }
};

    // Handle milestone change with error clearing
    const handleMilestoneChange = (e) => {
        setFormData({ ...formData, msId: e.target.value });
        
        // Clear amount error when changing milestone
        if (errors.amount) {
            setErrors(prev => ({
                ...prev,
                amount: ""
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            poNumber: poNumber,
            msId: "",
            amount: "",
            currency: "USD",
            utilizationType: "Fixed",
            resource: "",
            project: "",
            workDesc: "",
            workAssignDate: "",
            workCompletionDate: "",
            remarks: "",
            systemName: ""
        });
        setErrors({});
        setPoConsumptionFiles([]);
        setPOBalance(null);
        setMilestoneBalance(null);
        setSnackbar({
            open: false,
            message: '',
            severity: ''
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({}); // Clear previous errors

        try {
            const isValid = validateForm();
            if (!isValid) {
                setLoading(false);
                return;
            }

            const token = sessionStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/po-consumption/add`,
                formData,
                {
                    headers: {
                        Authorization: `${token}`,
                    },
                }
            );

            const data = response.data;
            console.log("PO Consumption Created:", data);
            setSnackbar({
                open: true,
                message: "PO Consumption Created Successfully",
                severity: "success",
            });

            const consumptionId = data.utilizationId; // Assuming the response contains the created consumption ID

            // Upload attachments if any
            if (poConsumptionFiles.length > 0) {
                for (const file of poConsumptionFiles) {
                    const attachmentForm = new FormData();
                    attachmentForm.append("file", file);
                    attachmentForm.append("level", "CONSUMPTION");
                    attachmentForm.append("referenceId", consumptionId);

                    try {
                        const uploadRes = await fetch(
                            `${import.meta.env.VITE_API_URL}/api/po-attachments/upload`,
                            {
                                method: "POST",
                                headers: {
                                    Authorization: `${token}`,
                                },
                                body: attachmentForm,
                            }
                        );

                        if (!uploadRes.ok) {
                            console.error(`Attachment upload failed for ${file.name}`);
                            setSnackbar({
                                open: true,
                                message: "Attachment upload failed",
                                severity: "error",
                            });
                        }
                    } catch (err) {
                        console.error("Attachment upload error:", err);
                        setSnackbar({
                            open: true,
                            message: "Attachment upload failed",
                            severity: "error",
                        });
                    }
                }
            }

            handleClose();

        } catch (error) {
            console.error("Error creating PO Consumption:", error);
            setSnackbar({
                open: true,
                message: "Error creating PO Consumption",
                severity: "error",
            });
            setErrors({
                submit: "Network error. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDateInputClick = (inputName) => {
        const dateInput = document.getElementsByName(inputName)[0];
        if (dateInput) {
            dateInput.showPicker();
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        // Limit to 4 files total
        if (poConsumptionFiles.length + files.length > 4) {
            setSnackbar({
                open: true,
                message: "You can upload a maximum of 4 attachments.",
                severity: "error"
            });
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg",
            "image/png",
            "image/gif",
            "text/plain",
        ];

        let error = "";
        const validFiles = [];

        for (const file of files) {
            if (file.size > maxSize) {
                error = "File must be under 10MB.";
                break;
            }
            if (!allowedTypes.includes(file.type)) {
                error = "Unsupported file type. Upload PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, or TXT.";
                break;
            }
            validFiles.push(file);
        }

        if (error) {
            setSnackbar({
                open: true,
                message: error,
                severity: "error"
            });
            return;
        }

        setPoConsumptionFiles((prev) => [...prev, ...validFiles]);
        e.target.value = null;
    };

    // Reset form when modal opens
    useEffect(() => {
        if (open && poId) {
            resetForm();
        }
    }, [open, poId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-[90vw] w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-green-900 flex items-center">
                            <Activity size={20} className="mr-2 text-green-600" />
                            Create New PO Consumption
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='p-6 overflow-y-auto flex-grow'>
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                                <span className="text-red-700 text-sm">{errors.submit}</span>
                            </div>
                        )}

                        <div className='grid grid-cols-5 gap-4'>
                            <div>
                                <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 mb-2">PO Number*</label>
                                <input
                                    type="text"
                                    name="poNumber"
                                    value={formData.poNumber}
                                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                    className='w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100'
                                    disabled />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Milestone (optional)
                                </label>
                                <select
                                    name="msId"
                                    id="msId"
                                    value={formData.msId}
                                    onChange={handleMilestoneChange}
                                    className="w-full h-10 px-4 border border-gray-300 rounded-md"
                                >
                                    <option value="" title="No specific milestone selected">
                                        No specific milestone
                                    </option>
                                    {milestones.map((milestone) => (
                                        <option key={milestone.msId} value={milestone.msId}>
                                            {milestone.msName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="currency" className='block text-sm font-medium text-gray-700 mb-2'>Currency</label>
                                <input
                                    type="text"
                                    name="currency"
                                    value={po.poCurrency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    disabled
                                    className='w-full h-10 px-4 border border-gray-300 rounded-md bg-gray-100'
                                />
                            </div>

                            <div>
                                <div className='flex justify-between items-center'>
                                    <label htmlFor="amount" className='block text-sm font-medium text-gray-700 mb-2'>
                                        Amount*
                                    </label>
                                 
<label className='text-right text-[10px]'>
    {formData.msId && milestoneBalance !== null ? (
        <span className="text-green-600">
            Milestone Balance: {getCurrencySymbol(formData.currency)}{milestoneBalance.toLocaleString()}
        </span>
    ) : (
        <span className="text-green-600">
            PO Balance: {getCurrencySymbol(formData.currency)}{poBalance !== null ? poBalance.toLocaleString() : 'Loading...'}
        </span>
    )}
</label>
                                </div>

                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleAmountChange}
                                    className={`w-full h-10 px-4 border rounded-md ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder='Enter Amount'
                                    min="0.01"
                                    step="0.01"
                                />
                                {errors.amount && (
                                    <p className="mt-1 text-red-600 text-xs leading-tight">{errors.amount}</p>
                                )}
                            </div>

                            <div className="">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type *
                                </label>
                                <select
                                    name="utilizationType"
                                    value={formData.utilizationType}
                                    onChange={(e) => setFormData({ ...formData, utilizationType: e.target.value })}
                                    className={`w-full h-10 px-4 border border-gray-300 rounded-md  ${errors.utilizationType ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                    title={`Selected Type: ${formData.utilizationType}`}
                                >
                                    <option value="Fixed" title="Fixed Price - Predetermined cost for specific deliverables">Fixed</option>
                                    <option value="T&M" title="Time and Materials - Billing based on actual time and resources used">T&M</option>
                                    <option value="Mixed" title="Mixed Model - Combination of fixed and time-based billing">Mixed</option>
                                </select>
                                {errors.utilizationType && (
                                    <p className="mt-1 text-xs text-red-600" title={`Error: ${errors.utilizationType}`}>
                                        {errors.utilizationType.length > 30 ? `${errors.utilizationType.substring(0, 30)}...` : errors.utilizationType}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className='grid grid-cols-5 gap-4'>
                            <div className="">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resource
                                </label>
                                <CreatableSelect
                                    isClearable
                                    isDisabled={loading}
                                    placeholder="Select or type a resource"
                                    title={formData.resource ? `Resource: ${formData.resource}` : "Select or type a resource"}
                                    onChange={(selectedOption) =>
                                        setFormData({ ...formData, resource: selectedOption ? selectedOption.value : '' })
                                    }
                                    value={formData.resource ? { value: formData.resource, label: formData.resource } : null}
                                    options={resourceOptions}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            fontSize: 'medium',
                                            borderRadius: '0.375rem',
                                            borderColor: errors.resource ? '#f87171' : '#d1d5db',
                                            padding: "0 1rem",
                                            height: "2.5rem"
                                        }),
                                    }}
                                />
                                {users.length === 0 && (
                                    <p className="mt-1 text-xs text-gray-500" title="Loading resources from server...">Loading resources...</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project
                                </label>
                                <CreatableSelect
                                    isClearable
                                    isDisabled={loading}
                                    placeholder="Select or type a project"
                                    title={formData.project ? `Project: ${formData.project}` : "Select or type a project"}
                                    onChange={(selectedOption) =>
                                        setFormData({ ...formData, project: selectedOption ? selectedOption.value : '' })
                                    }
                                    value={formData.project ? { value: formData.project, label: formData.project } : null}
                                    options={projectOptions}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            fontSize: 'medium',
                                            borderRadius: '0.375rem',
                                            borderColor: errors.project ? '#f87171' : '#d1d5db',
                                            padding: "0 1rem",
                                            height: "2.5rem"
                                        }),
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="systemName" className='block text-sm font-medium text-gray-700 mb-2'>System Name</label>
                                <input
                                    type="text"
                                    name="systemName"
                                    value={formData.systemName}
                                    onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                                    className='w-full h-10 px-4 border border-gray-300 rounded-md'
                                    placeholder='Enter System Name'
                                />
                            </div>

                            <div>
                                <label htmlFor="workAssignDate" className='block text-sm font-medium text-gray-700 mb-2'>
                                    Work Assign Date
                                </label>
                                <input
                                    type="date"
                                    name='workAssignDate'
                                    value={formData.workAssignDate}
                                    onChange={(e) => setFormData({ ...formData, workAssignDate: e.target.value })}
                                    className='w-full h-10 px-4 border border-gray-300 rounded-md'
                                    placeholder='Enter Work Assign Date'
                                    onClick={() => handleDateInputClick('workAssignDate')}
                                />
                            </div>

                            <div>
                                <label htmlFor="workCompletionDate" className='block text-sm font-medium text-gray-700 mb-2'>
                                    Work Completion Date
                                </label>
                                <input
                                    type="date"
                                    name='workCompletionDate'
                                    value={formData.workCompletionDate}
                                    onChange={(e) => setFormData({ ...formData, workCompletionDate: e.target.value })}
                                    onClick={() => handleDateInputClick('workCompletionDate')}
                                    className='w-full h-10 px-4 border border-gray-300 rounded-md'
                                    placeholder='Enter Work Completion Date'
                                />
                            </div>
                        </div>

                        <div className="">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                PO Consumption Attachments (Max 4)
                            </label>

                            <input
                                type="file"
                                name="poConsumptionAttachment"
                                onChange={handleFileChange}
                                className="w-full px-4 h-10 text-sm border border-gray-300 rounded-md file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                disabled={loading}
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                                title="Upload document or image file (max 10MB)"
                            />

                            {/* Selected Files List */}
                            <ul className="mt-2 text-xs text-gray-700 space-y-1">
                                {poConsumptionFiles.map((file, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                                    >
                                        <span className="truncate max-w-[200px]" title={file.name}>
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removePOConsumptionFile(index)}
                                            className="ml-2 text-red-600 hover:text-red-800 text-xs"
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <label htmlFor="description" className='block text-sm font-medium text-gray-700 mb-2'>
                                Description
                                <span className='float-right text-xs text-gray-500'>
                                    {formData.workDesc.length}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="workDesc"
                                value={formData.workDesc}
                                onChange={(e) => setFormData({ ...formData, workDesc: e.target.value })}
                                className='w-full h-20 px-4 py-2 border border-gray-300 rounded-md'
                                placeholder="Enter detailed work description including tasks, deliverables, scope, and requirements... (Max 500 characters)"
                                maxLength={500}
                            />
                        </div>

                        <div>
                            <label htmlFor="remarks" className='block text-sm font-medium text-gray-700 mb-2'>
                                Remarks
                                <span className='float-right text-xs text-gray-500'>
                                    {formData.remarks.length}/500 characters
                                </span>
                            </label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                className='w-full h-20 px-4 py-2 border border-gray-300 rounded-md'
                                placeholder='Enter Remarks'
                                maxLength={500}
                            />
                        </div>

                        <div className='flex justify-end space-x-4'>
                            <button
                                type='button'
                                onClick={handleClose}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <GlobalSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            />
            
        </div>
    )
}

export default CreateNewPOConsumption