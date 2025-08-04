import React from 'react'

const ProfileModal = ({ selectedProfile, onClose, title = "Profile Details", isOpen }) => {
    console.log(selectedProfile)
    return (
        <>
            <div
                className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm z-998 transition-opacity"
                onClick={onClose}
            />

            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-2xl shadow-2xl z-999 max-h-[90vh] overflow-y-auto scrollbar-hide m-4 mt-0">
                <button
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-full transition-all duration-200 z-10 shadow-sm"
                    onClick={onClose}
                >
                    ×
                </button>

                {/* Compact Header Section */}
                <div className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 rounded-t-2xl">
                    <div className="absolute inset-0 bg-black/10 rounded-t-2xl"></div>
                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                        <img
                            src={
                                selectedProfile.photo
                                    ? `data:image/jpeg;base64,${selectedProfile.photo}`
                                    : "./profilepic.jpg"
                            }
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-white/30 shadow-lg"
                            alt="Profile"
                        />

                        <div className="flex-1 text-center sm:text-left text-white">
                            <h2 className="text-xl sm:text-2xl font-bold mb-1 drop-shadow-sm">
                                {selectedProfile.firstName} {selectedProfile.middleName ? selectedProfile.middleName + " " : ""}{selectedProfile.lastName}
                            </h2>
                            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                                <span className="text-sm font-medium">{selectedProfile.empCode}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                                    <span className="opacity-90">Email:</span>
                                    <span className="font-medium break-all">{selectedProfile.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                                    <span className="opacity-90">Joined:</span>
                                    <span className="font-medium">
                                        {selectedProfile.dateOfJoining ? new Date(selectedProfile.dateOfJoining).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                                    <span className="opacity-90">Role:</span>
                                    <span className="font-medium">{selectedProfile.roleName || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6 bg-gray-50 space-y-6">
                    {/* Contact & Location - Full Width Horizontal */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Contact & Location</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <span className="text-gray-600 text-sm block mb-1">Mobile</span>
                                <span className="text-gray-900 font-medium">{selectedProfile.mobilePhone || "Not provided"}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 text-sm block mb-1">Office</span>
                                <span className="text-gray-900 font-medium">{selectedProfile.lanPhone || "Not provided"}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 text-sm block mb-1">Location</span>
                                <span className="text-gray-900 font-medium">
                                    {selectedProfile.city || selectedProfile.state || selectedProfile.country 
                                        ? `${selectedProfile.city ? selectedProfile.city + ', ' : ''}${selectedProfile.state ? selectedProfile.state + ', ' : ''}${selectedProfile.country || ''}`
                                        : "Not specified"}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 text-sm block mb-1">Address</span>
                                <span className="text-gray-900 font-medium">
                                    {selectedProfile.addressLine1 || "Not provided"}
                                    {selectedProfile.addressLine2 && `, ${selectedProfile.addressLine2}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Teams - Two Column Layout */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-purple-600 rounded-sm"></div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Project Teams</h3>
                            </div>
                            <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                                {selectedProfile.projectTeams?.length || 0}
                            </span>
                        </div>
                        {selectedProfile.projectTeams && selectedProfile.projectTeams.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedProfile.projectTeams.map((team, i) => (
                                    <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                                        <span className="text-gray-900 text-sm font-medium truncate" title={team.projectName}>
                                            {team.projectName || `Team ${i + 1}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No active teams</p>
                        )}
                    </div>

                    {/* Certifications */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Certifications</h3>
                        </div>
                        {selectedProfile.certificates && selectedProfile.certificates.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {selectedProfile.certificates.map((cert, i) => (
                                    <div key={i} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                        <span className="text-gray-900 text-sm font-medium">{cert.name || cert}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">No certifications available</p>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
            </div>
        </>
    )
}

export default ProfileModal