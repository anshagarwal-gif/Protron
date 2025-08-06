import React, { useEffect, useState } from "react";
import { X, Calendar, User, Users, Settings, Building, FileText, Clock } from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProjectDetailsModal = ({ projectId, onClose }) => {
  const [projectDetails, setProjectDetails] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [systemsImpacted, setSystemsImpacted] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `${sessionStorage.getItem("token")}` },
        });
        const { project, teamMembers, systemsImpacted } = response.data;
        setProjectDetails(project);
        setTeamMembers(teamMembers);
        setSystemsImpacted(systemsImpacted);
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  if (!projectId) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <div className="px-8 py-6 bg-gradient-to-r from-emerald-800 to-green-900 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className=" bg-opacity-20 p-3 rounded-xl">
                <Building size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Project Details</h2>
                <p className="text-slate-200 mt-1">
                  {projectDetails?.projectName || 'Loading...'}
                </p>
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-emerald-600 hover:bg-emerald-500 transition ease-in-out duration-150">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading project details...
              </div>
            </div>
          ) : projectDetails ? (
            <>
              {/* Project Overview Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <FileText className="mr-3 text-blue-600" size={24} />
                  Project Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Field
                    label="Project Name"
                    value={projectDetails.projectName}
                    icon={Building}
                  />
                  <Field
                    label="Tenant"
                    value={projectDetails.tenantName || "No tenant specified"}
                    icon={Building}
                  />
                  <Field
                    label="Start Date"
                    value={formatDate(projectDetails.startDate)}
                    icon={Calendar}
                  />
                  <Field
                    label="End Date"
                    value={formatDate(projectDetails.endDate)}
                    icon={Calendar}
                  />
                  <Field
                    label="Project Cost"
                    value={projectDetails.unit + " " + projectDetails.projectCost}
                  />
                </div>
              </div>

              {/* Leadership Section */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                  <User className="mr-3 text-orange-600" size={24} />
                  Project Leadership
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    label="Project Manager"
                    value={projectDetails.projectManagerName || "Not assigned"}
                    icon={User}
                  />
                  <Field
                    label="Sponsor"
                    value={projectDetails.sponsorName || "Not assigned"}
                    icon={User}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Members Section */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Users className="mr-3 text-purple-600" size={24} />
                    Team Members ({teamMembers.length})
                  </h3>
                  <div className="bg-white rounded-xl p-6 border border-purple-200 min-h-[200px]">
                    {teamMembers.length > 0 ? (
                      <div className="space-y-3">
                        {teamMembers.map((member, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={16} className="text-purple-600" />
                            </div>
                            <span className="text-slate-900 font-medium">
                              {member.fullName}
                              {member.empCode && (
                                <span className="text-slate-500 ml-1">
                                  ({member.empCode})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="text-center">
                          <Users size={48} className="mx-auto mb-4 text-slate-300" />
                          <p>No team members assigned</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Systems Impacted Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Settings className="mr-3 text-emerald-600" size={24} />
                    Systems Impacted ({systemsImpacted.length})
                  </h3>
                  <div className="bg-white rounded-xl p-6 border border-green-200 min-h-[200px]">
                    {systemsImpacted.length > 0 ? (
                      <div className="space-y-3">
                        {systemsImpacted.map((system, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <Settings size={16} className="text-green-600" />
                            </div>
                            <span className="text-slate-900 font-medium">
                              {system.systemName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="text-center">
                          <Settings size={48} className="mx-auto mb-4 text-slate-300" />
                          <p>No systems impacted</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Building size={64} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 text-lg">No project details available</p>
            </div>
          )}
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

export default ProjectDetailsModal;