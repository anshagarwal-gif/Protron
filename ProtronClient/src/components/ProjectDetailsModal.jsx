import React, { useEffect, useState } from "react";
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

  return (
    <>
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl z-50 p-4 sm:p-6 md:p-8 overflow-y-auto m-4">
        <button
          className="absolute top-2 right-2 text-red-700 hover:text-red-900 cursor-pointer text-xl font-bold z-10"
          onClick={onClose}
        >
          X
        </button>
        {isLoading ? (
          <div className="text-center py-6">Loading...</div>
        ) : projectDetails ? (
          <>
            <div className="flex flex-col sm:flex-row items-center sm:items-start bg-green-700 space-y-4 sm:space-y-0 sm:space-x-8 mb-6 md:mb-8 p-4 sm:p-6 border-b border-gray-200 rounded-t-lg">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-green-600 rounded-full flex items-center justify-center border-4 border-gray-100 flex-shrink-0">
                <svg
                  className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H9m3 0V9"
                  />
                </svg>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">
                  {projectDetails.projectName}
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-white mb-2 sm:mb-4">
                  {projectDetails.tenantName || "No tenant specified"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-8 sm:gap-y-2">
                  <div className="text-sm sm:text-base">
                    <span className="font-bold text-white">Start Date:</span>
                    <span className="ml-2 text-white">{projectDetails.startDate}</span>
                  </div>
                  <div className="text-sm sm:text-base">
                    <span className="font-bold text-white">End Date:</span>
                    <span className="ml-2 text-white">{projectDetails.endDate}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-green-100 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">
                    Systems Impacted ({systemsImpacted.length})
                  </h3>
                  {systemsImpacted.length > 0 ? (
                    <ul className="space-y-2">
                      {systemsImpacted.map((system, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-900 text-sm sm:text-base">
                            {system.systemName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm sm:text-base">No systems impacted</p>
                  )}
                </div>
              </div>
              <div>
                <div className="bg-green-100 p-4 sm:p-6 rounded-lg h-full">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">
                    Leadership
                  </h3>
                  <div className="text-sm sm:text-base space-y-4 text-gray-900">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Project Manager:</p>
                      <p className="text-gray-900">
                        {projectDetails.projectManagerName || "Not assigned"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Sponsor:</p>
                      <p className="text-gray-900">
                        {projectDetails.sponsorName || "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-green-100 p-4 sm:p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">
                    Team Members ({teamMembers.length})
                  </h3>
                  {teamMembers.length > 0 ? (
                    <ul className="space-y-2">
                      {teamMembers.map((member, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-900 text-sm sm:text-base">
                            {member.fullName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm sm:text-base">No team members assigned</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6">No project details available.</div>
        )}
      </div>
    </>
  );
};

export default ProjectDetailsModal;