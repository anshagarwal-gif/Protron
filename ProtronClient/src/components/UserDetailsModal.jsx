import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    User,
    Mail,
    Building,
    Phone,
    Globe,
    Briefcase,
    FolderOpen,
    Shield,
    Lock,
    Unlock,
    Eye,
    Edit3,
    Trash2,
    CheckCircle,
    XCircle,
    X,
} from "lucide-react";

const UserDetailsModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);

    // Define access rights mapping for easier display
    const accessMapping = {
        canView: { label: "View", icon: Eye, color: "emerald" },
        canEdit: { label: "Edit", icon: Edit3, color: "green" },
        canDelete: { label: "Delete", icon: Trash2, color: "red" },
    };

    // Step 1: Process role access rights
    const processedAccessRights = (user.role?.roleAccessRights || []).reduce(
        (acc, current) => {
            const { moduleName, canView, canEdit, canDelete } = current.accessRight;
            acc[moduleName] = { canView, canEdit, canDelete };
            return acc;
        },
        {}
    );

    // Step 2: Override with user-specific access rights (priority)
    (user.userAccessRights || []).forEach((current) => {
        const { moduleName, canView, canEdit, canDelete } = current.accessRight;
        processedAccessRights[moduleName] = { canView, canEdit, canDelete };
    });

    // Determine user status styling
    const getStatusStyle = (status) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 border border-green-200";
            case "hold":
                return "bg-yellow-100 text-yellow-800 border border-yellow-200";
            case "inactive":
                return "bg-red-100 text-red-800 border border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border border-gray-200";
        }
    };

    const getPermissionBadgeStyle = (hasPermission, colorScheme) => {
        if (hasPermission) {
            // Simplifies styles to match new aesthetic
            switch (colorScheme) {
                case "emerald":
                case "green":
                    return "bg-green-50 text-green-700 border-green-200";
                case "red":
                    return "bg-red-50 text-red-700 border-red-200";
                default:
                    return "bg-gray-50 text-gray-700 border-gray-200";
            }
        }
        return "bg-gray-50 text-gray-400 border-gray-200";
    };

    const fetchProjects = async () => {
        setProjectsLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) {
            setProjectsLoading(false);
            return;
        }
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/projects/user/active-projects?userId=${user.userId
                }`,
                {
                    headers: {
                        Authorization: `${token}`,
                    },
                }
            );
            setProjects(res.data);
        } catch (err) {
            console.log(err);
        } finally {
            setProjectsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchProjects();
        }
    }, [isOpen, user]);

    // Field component for consistent styling
    const Field = ({ label, value, className = "", fullWidth = false }) => (
        <div className={`${className} ${fullWidth ? 'col-span-full' : ''}`}>
            <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
            <div className="text-sm text-gray-900 font-medium break-words overflow-wrap-anywhere">
                {value || "N/A"}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 bg-green-600 text-white rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <User size={24} className="text-white" />
                            <div>
                                <h2 className="text-xl font-bold">User Details</h2>
                                <p className="text-green-100 text-sm">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-green-700 rounded-full transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">

                    {/* Basic Information Section */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <User size={18} className="mr-2 text-green-600" />
                                Basic Information
                            </h3>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(
                                    user.status
                                )}`}
                            >
                                {user.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field label="Full Name" value={user.name} />
                            <Field label="Tenant" value={user.tenantName} />
                            <Field label="Role" value={user.role?.roleName || "No Role Assigned"} />
                            <Field label="Phone" value={user.mobilePhone} />
                            <Field label="Country" value={user.country} />
                            <Field label="City" value={user.city} />
                            <Field label="Email" value={user.email} />
                        </div>
                    </div>

                    {/* Active Projects Section */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Briefcase size={18} className="mr-2 text-green-600" />
                            Active Projects
                        </h3>

                        {projectsLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                <span className="ml-2 text-gray-600 text-sm">Loading initiatives...</span>
                            </div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map((project) => (
                                    <div
                                        key={project.projectId}
                                        className="bg-white rounded border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <FolderOpen size={18} className="text-green-600" />
                                            <h4 className="font-medium text-gray-900 text-sm truncate" title={project.projectName}>
                                                {project.projectName}
                                            </h4>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-gray-500">ID: {project.projectId}</span>
                                            <span className="text-[10px] font-bold uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-gray-500 text-sm">No active projects found for this user.</p>
                            </div>
                        )}
                    </div>

                    {/* Access Rights Section */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Shield size={18} className="mr-2 text-green-600" />
                            Access Rights
                        </h3>

                        {Object.keys(processedAccessRights).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(processedAccessRights).map(
                                    ([module, rights]) => (
                                        <div
                                            key={module}
                                            className="bg-white rounded border border-gray-200 p-4"
                                        >
                                            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                                <h4 className="font-semibold text-gray-800 text-sm capitalize flex items-center">
                                                    <Lock size={14} className="mr-2 text-gray-400" />
                                                    {module}
                                                </h4>
                                                {Object.values(rights).every(Boolean) && (
                                                    <Unlock size={14} className="text-green-500" />
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(accessMapping).map(([rightKey, config]) => {
                                                    const hasPermission = rights[rightKey];
                                                    const IconComponent = config.icon;

                                                    if (!hasPermission) return null;

                                                    return (
                                                        <div key={rightKey} className={`flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getPermissionBadgeStyle(true, config.color)}`}>
                                                            <IconComponent size={12} />
                                                            <span>{config.label}</span>
                                                        </div>
                                                    )
                                                })}

                                                {Object.values(rights).every(v => !v) && (
                                                    <span className="text-xs text-gray-400 italic">No permissions set</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-gray-500 text-sm">No specific access rights configured.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with Close button */}
                <div className="p-6 border-t border-green-200 bg-white/50 backdrop-blur-sm flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        Close
                    </button>
                </div>

            </div >
        </div >
    );
};

export default UserDetailsModal;
