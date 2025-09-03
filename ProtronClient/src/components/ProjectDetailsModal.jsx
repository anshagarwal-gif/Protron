import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EditProjectModal from "./EditProjectModal";
import { X, Calendar, User, Users, Settings, Building, FileText, Hash, Target, CheckCircle } from "lucide-react";
import axios from "axios";
import { useAccess } from "../Context/AccessContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProjectDetailsModal = ({ projectId, onClose, fetchProjects }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [systemsImpacted, setSystemsImpacted] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const {hasAccess} = useAccess();
    const [ridaList, setRidaList] = useState([]);
    const [releaseList, setReleaseList] = useState([]);
    const [sprintList, setSprintList] = useState([]);

  const handleProjectEdit = (projectId) => {
    setShowEditModal(false);
    fetchProjectDetails(projectId);
    fetchProjects();
  }

  // Delete project handler
  const handleDeleteProject = async () => {
    if (!projectId) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/projects/delete/${projectId}`, {
        headers: { Authorization: `${sessionStorage.getItem("token")}` },
      });
      fetchProjects();
      onClose();
    } catch (error) {
      alert("Failed to delete project.");
      console.error("Error deleting project:", error);
    }
  };

 const fetchProjectDetails = async (projectId) => {
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

  useEffect(() => {

    if (projectId) {
        fetchRidaList(projectId);
        fetchReleaseList(projectId);
        fetchSprintList(projectId);
      fetchProjectDetails(projectId);
    }
  }, [projectId]);
    // Fetch RIDA, Release, Sprint lists
    const fetchRidaList = async (projectId) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rida/project/${projectId}`, {
          method: 'GET',
          headers: { 'authorization': `${sessionStorage.getItem('token')}` },
        });
        const data = await res.json();
        setRidaList(data);
      } catch (e) { setRidaList([]); }
    };
    const fetchReleaseList = async (projectId) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/releases/project/${projectId}`, {
          method: 'GET',
          headers: { 'authorization': `${sessionStorage.getItem('token')}` },
        });
        const data = await res.json();
        setReleaseList(data);
      } catch (e) { setReleaseList([]); }
    };
    const fetchSprintList = async (projectId) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/sprints/project/${projectId}`, {
          method: 'GET',
          headers: { 'authorization': `${sessionStorage.getItem('token')}` },
        });
        const data = await res.json();
        setSprintList(data);
      } catch (e) { setSprintList([]); }
    };

  if (!projectId) return null;

  // Format date as DD-Mon-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Field component for consistent styling (matching PO modal)
  const Field = ({ label, value, className = "" }) => (
    <div className={className}>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <div
        className="text-sm text-gray-900 font-medium truncate"
        title={value || "N/A"}
        style={{ maxWidth: '100%' }}
      >
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-green-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Building size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate">Project Details</h2>
                <p className="text-green-100 text-xs sm:text-sm truncate">
                  {projectDetails?.projectCode || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Edit button in header */}
              {hasAccess("projects", "edit") && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 hover:bg-green-700 rounded-lg transition-colors flex-shrink-0"
                  title="Edit Project"
                  disabled={!projectDetails}
                >
                  <Pencil size={18} className="sm:w-5 sm:h-5" />
                </button>
              )}
              {/* Delete button in header */}
              {hasAccess("projects", "delete") && (
                <button
                onClick={handleDeleteProject}
                className="p-2 hover:bg-red-700 rounded-lg transition-colors flex-shrink-0"
                title="Delete Project"
                disabled={!projectDetails}
              >
                <Trash2 size={18} className="sm:w-5 sm:h-5 text-red-600" />
              </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-green-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-600 text-sm flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                Loading project details...
              </div>
            </div>
          ) : projectDetails ? (
            <>
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                  <Hash className="mr-2 text-green-600" size={18} />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  <Field
                    label="Project Name"
                    value={projectDetails.projectName}
                  />
                  <Field
                    label="Tenant"
                    value={projectDetails.tenantName || "No tenant specified"}
                  />
                  <Field
                    label="Start Date"
                    value={formatDate(projectDetails.startDate)}
                  />
                  <Field
                    label="End Date"
                    value={formatDate(projectDetails.endDate)}
                  />
                  <Field
                    label="Project Cost"
                    value={projectDetails.unit + " " + projectDetails.projectCost}
                    className="sm:col-span-2 lg:col-span-1"
                  />
                </div>
              </div>

              {/* Leadership Information */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                  <Target className="mr-2 text-green-600" size={18} />
                  Leadership Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  <Field
                    label="Project Manager"
                    value={projectDetails.managerName || "Not assigned"}
                  />
                  <Field
                    label="Project Sponsor"
                    value={projectDetails.sponsorName || "Not assigned"}
                  />
                  <Field
                    label="Product Owner"
                    value={projectDetails.productOwner || "Not assigned"}
                  />
                  <Field
                    label="Scrum Master"
                    value={projectDetails.scrumMaster || "Not assigned"}
                  />
                  <Field
                    label="Architect"
                    value={projectDetails.architect || "Not assigned"}
                  />
                  <Field
                    label="Chief Scrum Master"
                    value={projectDetails.chiefScrumMaster || "Not assigned"}
                  />
                  <Field
                    label="Delivery Leader"
                    value={projectDetails.deliveryLeader || "Not assigned"}
                  />
                  <Field
                    label="Business Unit Funded By"
                    value={projectDetails.businessUnitFundedBy || "Not assigned"}
                  />
                  <Field
                    label="Business Unit Delivered To"
                    value={projectDetails.businessUnitDeliveredTo || "Not assigned"}
                  />
                  <Field
                    label="Priority"
                    value={projectDetails.priority ? projectDetails.priority : "N/A"}
                  />
                  <Field
                    label="Business Value Amount"
                    value={projectDetails.businessValueAmount ? projectDetails.businessValueAmount : "N/A"}
                  />
                  <Field
                    label="Business Value Type"
                    value={projectDetails.businessValueType ? projectDetails.businessValueType : "N/A"}
                  />
                </div>
              </div>

              {/* Team Members and Systems - Stack on small screens, side by side on larger */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Team Members */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                    <Users className="mr-2 text-green-600" size={18} />
                    Team Members ({teamMembers.length})
                  </h3>
                  <div className="bg-white rounded p-2 sm:p-3 border min-h-[150px] sm:min-h-[200px]">
                    {teamMembers.length > 0 ? (
                      <div className="space-y-2">
                        {teamMembers.map((member, index) => (
                          <div key={index} className="flex items-center text-xs sm:text-sm p-2 border rounded bg-gray-50">
                            <User size={14} className="sm:w-4 sm:h-4 text-gray-600 mr-2 flex-shrink-0" />
                            <span className="text-gray-900 font-medium min-w-0 flex-1">
                              <span className="block truncate">
                                {member.fullName}
                                {member.empCode && (
                                  <span className="text-gray-500 ml-1">
                                    ({member.empCode})
                                  </span>
                                )}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <Users size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
                          <p className="text-xs sm:text-sm">No team members assigned</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Systems Impacted */}
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                          <Settings className="mr-2 text-green-600" size={18} />
                          Systems Impacted ({systemsImpacted.length})
                          </h3>
                          <div className="bg-white rounded p-2 sm:p-3 border min-h-[150px] sm:min-h-[200px]">
                          {systemsImpacted.length > 0 ? (
                            <div className="space-y-2">
                            {systemsImpacted.map((system, index) => (
                              <div key={index} className="flex items-center text-xs sm:text-sm p-2 border rounded bg-gray-50">
                              <Settings size={14} className="sm:w-4 sm:h-4 text-gray-600 mr-2 flex-shrink-0" />
                              <span className="text-gray-900 font-medium min-w-0 flex-1 truncate">
                                {system.systemName}
                              </span>
                              </div>
                            ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <Settings size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
                              <p className="text-xs sm:text-sm">No systems impacted</p>
                            </div>
                            </div>
                          )}
                          </div>
                        </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                          <CheckCircle className="mr-2 text-green-600" size={18} />
                          Definition of Done
                        </h3>
                        <div className="bg-white rounded p-2 sm:p-3 border min-h-[60px] text-gray-900 text-sm break-words whitespace-pre-wrap">
                          {projectDetails.defineDone ? projectDetails.defineDone : <span className="text-gray-500">No DoD defined for this project.</span>}
                        </div>
                        </div>

                        {/* RIDA Table */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">RIDA List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 border">#</th>
                        <th className="px-2 py-1 border">Type</th>
                        <th className="px-2 py-1 border">Meeting Ref</th>
                        <th className="px-2 py-1 border">Date Raised</th>
                        <th className="px-2 py-1 border">Target Closer</th>
                        <th className="px-2 py-1 border">Description</th>
                        <th className="px-2 py-1 border">Raised By</th>
                        <th className="px-2 py-1 border">Owner</th>
                        <th className="px-2 py-1 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ridaList.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-2">No RIDA found</td></tr>
                      ) : ridaList.map((rida, idx) => (
                        <tr key={rida.id || idx}>
                          <td className="border px-2 py-1">{idx + 1}</td>
                          <td className="border px-2 py-1 truncate" title={rida.type}>{rida.type}</td>
                          <td className="border px-2 py-1 truncate" title={rida.meetingReference}>{rida.meetingReference}</td>
                          <td className="border px-2 py-1 truncate" title={rida.dateRaised}>{formatDate(rida.dateRaised)}</td>
                          <td className="border px-2 py-1 truncate" title={rida.targetCloser}>{formatDate(rida.targetCloser)}</td>
                          <td className="border px-2 py-1 truncate" title={rida.itemDescription}>{rida.itemDescription}</td>
                          <td className="border px-2 py-1 truncate" title={rida.raisedBy}>{rida.raisedBy}</td>
                          <td className="border px-2 py-1 truncate" title={rida.owner}>{rida.owner}</td>
                          <td className="border px-2 py-1 truncate" title={rida.status}>{rida.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Release Table */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">Release List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 border">#</th>
                        <th className="px-2 py-1 border">Release Name</th>
                        <th className="px-2 py-1 border">Start Date</th>
                        <th className="px-2 py-1 border">End Date</th>
                        <th className="px-2 py-1 border">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {releaseList.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-2">No Release found</td></tr>
                      ) : releaseList.map((rel, idx) => (
                        <tr key={rel.releaseId || idx}>
                          <td className="border px-2 py-1">{idx + 1}</td>
                          <td className="border px-2 py-1 truncate" title={rel.releaseName}>{rel.releaseName}</td>
                          <td className="border px-2 py-1 truncate" title={rel.startDate ? formatDate(rel.startDate) : ''}>{rel.startDate ? formatDate(rel.startDate) : ''}</td>
                          <td className="border px-2 py-1 truncate" title={rel.endDate ? formatDate(rel.endDate) : ''}>{rel.endDate ? formatDate(rel.endDate) : ''}</td>
                          <td className="border px-2 py-1 truncate" title={rel.description}>{rel.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sprint Table */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">Sprint List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 border">#</th>
                        <th className="px-2 py-1 border">Sprint Name</th>
                        <th className="px-2 py-1 border">Start Date</th>
                        <th className="px-2 py-1 border">End Date</th>
                        <th className="px-2 py-1 border">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sprintList.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-2">No Sprint found</td></tr>
                      ) : sprintList.map((sprint, idx) => (
                        <tr key={sprint.sprintId || idx}>
                          <td className="border px-2 py-1">{idx + 1}</td>
                          <td className="border px-2 py-1 truncate" title={sprint.sprintName}>{sprint.sprintName}</td>
                          <td className="border px-2 py-1 truncate" title={sprint.startDate ? formatDate(sprint.startDate) : ''}>{sprint.startDate ? formatDate(sprint.startDate) : ''}</td>
                          <td className="border px-2 py-1 truncate" title={sprint.endDate ? formatDate(sprint.endDate) : ''}>{sprint.endDate ? formatDate(sprint.endDate) : ''}</td>
                          <td className="border px-2 py-1 truncate" title={sprint.description}>{sprint.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Building size={48} className="sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 text-base sm:text-lg">No project details available</p>
            </div>
          )}
        </div>

        {/* Edit Project Modal */}
        {showEditModal && (
          <EditProjectModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            projectId={projectId}
            onSubmit={handleProjectEdit}
            // You may need to pass additional props for formData, setFormData, onSubmit, etc.
          />
        )}
        {/* Footer */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
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