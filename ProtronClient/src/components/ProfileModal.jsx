import React from 'react'

const ProfileModal = ({ selectedProfile, onClose, title = "Profile Details", isOpen }) => {
    console.log(selectedProfile)
    return (
        <>
            <div
                className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-40 transition-opacity"
                onClick={onClose}
            />

            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl z-50 p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto m-4">
                <button
                    className="absolute top-2 right-2 text-red-700 hover:text-red-900 cursor-pointer text-xl font-bold z-10"
                    onClick={onClose}
                >
                    X
                </button>

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start bg-green-700 space-y-4 sm:space-y-0 sm:space-x-8 mb-6 md:mb-8 p-4 sm:p-6 border-b border-gray-200 rounded-t-lg">
                    <img
                        src={
                            selectedProfile.photo
                                ? `data:image/jpeg;base64,${selectedProfile.photo}`
                                : "./profilepic.jpg"
                        }
                        className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-100 flex-shrink-0"
                        alt="Profile"
                    />

                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">
                            {selectedProfile.firstName} {selectedProfile.middleName ? selectedProfile.middleName + " " : ""}{selectedProfile.lastName}
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-white mb-2 sm:mb-4">{selectedProfile.empCode}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-8 sm:gap-y-2">
                            <div className="text-sm sm:text-base">
                                <span className="font-bold text-white">Email:</span>
                                <span className="ml-2 text-white break-all">{selectedProfile.email}</span>
                            </div>
                            <div className="text-sm sm:text-base">
                                <span className="font-bold text-white">Joined:</span>
                                <span className="ml-2 text-white">
                                    {selectedProfile.dateOfJoining ? new Date(selectedProfile.dateOfJoining).toLocaleDateString() : "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {/* Left Column */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-green-100 p-4 sm:p-6 rounded-lg">
                            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Contact Information</h3>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Mobile:</span>
                                    <span className="text-gray-900 text-sm sm:text-base break-all">{selectedProfile.mobilePhone || "N/A"}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Office:</span>
                                    <span className="text-gray-900 text-sm sm:text-base break-all">{selectedProfile.lanPhone || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-100 p-4 sm:p-6 rounded-lg">
                            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Organization</h3>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Company:</span>
                                    <span className="text-gray-900 text-sm sm:text-base sm:text-right break-all">{selectedProfile.tenant?.tenantName || "N/A"}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Role:</span>
                                    <span className="text-gray-900 text-sm sm:text-base sm:text-right break-all">{selectedProfile.role?.roleName || "N/A"}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <span className="font-medium text-gray-700 text-sm sm:text-base">Unit:</span>
                                    <span className="text-gray-900 text-sm sm:text-base sm:text-right break-all">{selectedProfile.unit || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column */}
                    <div>
                        <div className="bg-green-100 p-4 sm:p-6 rounded-lg h-full">
                            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Location</h3>
                            <div className="text-sm sm:text-base space-y-2 text-gray-900">
                                <p>{selectedProfile.addressLine1 || "N/A"}</p>
                                {selectedProfile.addressLine2 && <p>{selectedProfile.addressLine2}</p>}
                                {selectedProfile.addressLine3 && <p>{selectedProfile.addressLine3}</p>}
                                <p>
                                    {selectedProfile.city && `${selectedProfile.city}, `}
                                    {selectedProfile.state && `${selectedProfile.state}, `}
                                    {selectedProfile.zipCode && `${selectedProfile.zipCode}`}
                                </p>
                                <p>{selectedProfile.country || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-green-100 p-4 sm:p-6 rounded-lg">
                            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">
                                Project Teams ({selectedProfile.projectTeams?.length || 0})
                            </h3>
                            {selectedProfile.projectTeams && selectedProfile.projectTeams.length > 0 ? (
                                <div className="max-h-[120px] sm:max-h-[140px] overflow-y-auto pr-2">
                                    <ul className="space-y-2">
                                        {selectedProfile.projectTeams.map((team, i) => (
                                            <li key={i} className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                <span className="text-gray-900 truncate text-sm sm:text-base" title={team.project.projectName}>
                                                    {team.project.projectName || `Team ${i + 1}`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm sm:text-base">Not part of any teams</p>
                            )}
                        </div>

                        <div className="bg-green-100 p-4 sm:p-6 h-auto rounded-lg">
                            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Certifications</h3>
                            {selectedProfile.certificates && selectedProfile.certificates.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedProfile.certificates.map((cert, i) => (
                                        <li key={i} className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                            <span className="text-gray-900 text-sm sm:text-base">{cert.name || cert}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm sm:text-base">No certifications found</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProfileModal