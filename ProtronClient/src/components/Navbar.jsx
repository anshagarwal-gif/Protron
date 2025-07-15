import { useState, useEffect, useRef } from "react";
import { FiHome, FiUser, FiUserCheck, FiFolder,FiFileText, FiClock, FiLogOut, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAccess } from "../Context/AccessContext"; // Import AccessContext

const Navbar = ({ setIsAuthenticated }) => {
  const { hasAccess } = useAccess(); // Get access checking function

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const email = sessionStorage.getItem("email");
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleWindowClose = async (e) => {
      const userId = sessionStorage.getItem('userId');
      const token = sessionStorage.getItem('token');

      if (userId && token) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/users/logout/${userId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `${token}`
            },
            keepalive: true
          });
          console.log("Logout recorded during window close.");
        } catch (error) {
          console.error("Window close logout failed:", error);
        }
      }
    };

    window.addEventListener('beforeunload', handleWindowClose);

    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
    };
  }, []);

  const handleLogout = async () => {
    const userId = sessionStorage.getItem('userId');
    const token = sessionStorage.getItem('token');

    if (userId && token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/users/logout/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `${token}`
          }
        });
        console.log("Logout recorded via button click");

        // Clear session/local storage
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('userId');
        setIsAuthenticated(false);
        sessionStorage.removeItem('isAuthenticated');

        // Redirect to login page or handle as needed
        window.location.href = '/login'; // or use your router navigation
      } catch (error) {
        console.error("Logout failed:", error);
        // Handle error (show message to user, etc.)
      }
    }
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleProfileClick = async (email) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/email/${email}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` }
      });
      setProfile(res.data);
    } catch (error) {
      console.error("Error fetching profile", error);
    }
  };

  const fetchProfile = async (email) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/email/${email}`, {
        headers: { Authorization: `${sessionStorage.getItem('token')}` },
      });
      setProfile(res.data);
    } catch (error) {
      console.error("Error fetching profile", error);
    }
  };

  useEffect(() => {
    fetchProfile(email);
  }, [email]);

  // Handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle mobile navbar dropdown
      const navbar = document.querySelector(".navbar-dropdown");
      if (
        isMobile &&
        isOpen &&
        navbar &&
        !navbar.contains(event.target) &&
        !event.target.classList.contains("hamburger-button") &&
        !event.target.closest('.hamburger-button')
      ) {
        setIsOpen(false);
      }

      // Handle user profile dropdown
      if (
        userDropdownOpen &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMobile, userDropdownOpen]);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleNavItemClick = (section) => {
    if (isMobile) {
      setIsOpen(false);
    }
    navigate(`/${section}`);
  };

  const handleButtonClick = (email) => {
    toggleUserDropdown();
    handleProfileClick(email);
  };

  const modules = [
    { key: "dashboard", label: "Dashboard", path: "/dashboard", moduleName: "dashboard", icon: FiHome },
    { key: "projects", label: "Projects", path: "/projects", moduleName: "projects", icon: FiFolder },
    { key: "team", label: "Team", path: "/team", moduleName: "teams", icon: FiUserCheck },
    { key: "timesheet", label: "Timesheet", path: "/timesheet", moduleName: "timesheet", icon: FiClock },
    { key: "users", label: "Users", path: "/users", moduleName: "users", icon: FiUser },
{ key: "po", label: "Purchase Orders", path: "/po", moduleName: "users", icon: FiFileText },
  ];

  const currentPath = window.location.pathname;
 

  return (
    <div className="sticky top-0 z-50">
      {/* Main Navbar */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 text-white shadow-lg backdrop-blur-sm">
        <div className="w-full px-7">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Left Side */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <img 
                  src="./logo.png" 
                  className="h-8 w-8 rounded-full ring-2 ring-white/20" 
                  alt="Logo" 
                />
                <span className="text-xl font-semibold tracking-tight hidden sm:block">
                  {profile && profile.tenant && profile.tenant.tenantName ? (
                    profile.tenant.tenantName
                  ) : (
                    <div className="animate-pulse bg-white/20 h-6 w-32 rounded"></div>
                  )}
                </span>
              </div>
            </div>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-8">
              <div className="flex items-center space-x-5 rounded-lg p-1 backdrop-blur-sm">
                {modules.map((item) =>
                  hasAccess(item.moduleName, "view") ? (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        currentPath === item.path 
                          ? "bg-white text-green-900 shadow-sm" 
                          : "text-white/90 hover:text-white hover:bg-white/20"
                      }`}
                    >
                      <item.icon size={18} className="mr-2" />
                      <span>{item.label}</span>
                    </button>
                  ) : null
                )}
              </div>
            </div>

            {/* User Profile - Right Side */}
            <div className="flex items-center space-x-4">
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => handleButtonClick(email)}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-white/20 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-2">
                    <div className="bg-white/20 rounded-full p-2">
                      <FiUser size={18} />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">
                        {profile ? `${profile.firstName} ${profile.lastName}` : "Loading..."}
                      </div>
                      <div className="text-xs text-white/70">
                        {profile ? profile.email : ""}
                      </div>
                    </div>
                    <FiChevronDown 
                      className={`ml-1 transition-transform duration-200 ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`} 
                      size={16} 
                    />
                  </div>
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && profile && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 transform transition-all duration-200 ease-out">
                    {/* User Profile Section */}
                    <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-500 rounded-full p-3 shadow-md">
                          <span className="text-white text-lg font-bold">
                            {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-lg">
                            {`${profile.firstName} ${profile.lastName}`}
                          </div>
                          <div className="text-sm text-gray-600">{profile.email}</div>
                          <div className="text-sm text-gray-600">Role: {profile.role.roleName}</div>
                        </div>
                      </div>
                    </div>

                    {/* User Details Section */}
                    <div className="px-6 py-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="text-gray-500 font-medium">Employee Code:</div>
                          <div className="text-gray-800 font-semibold bg-gray-50 px-3 py-1 rounded-md">
                            {profile.empCode}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-gray-500 font-medium">Mobile:</div>
                          <div className="text-gray-800 font-semibold bg-gray-50 px-3 py-1 rounded-md">
                            {profile.mobilePhone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-6 py-4 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 group"
                      >
                        <FiLogOut className="mr-3 text-gray-500 group-hover:text-red-600" size={18} />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  className="hamburger-button text-white p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
                  onClick={toggleNavbar}
                  aria-label="Toggle menu"
                >
                  {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobile && (
        <div
          className={`navbar-dropdown lg:hidden bg-white shadow-lg border-t border-gray-200 overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <nav>
              <ul className="space-y-2">
                {modules.map((item) =>
                  hasAccess(item.moduleName, "view") ? (
                    <li key={item.key}>
                      <button
                        onClick={() => handleNavItemClick(item.key)}
                        className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                          currentPath === item.path
                            ? "bg-green-100 text-green-900 border-l-4 border-green-500"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon size={20} className="mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </li>
                  ) : null
                )}
                
                {/* Mobile User Section */}
                <li className="border-t border-gray-200 mt-4 pt-4">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 rounded-full p-2">
                        <span className="text-white text-sm font-bold">
                          {profile ? `${profile.firstName?.charAt(0)}${profile.lastName?.charAt(0)}` : "U"}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {profile ? `${profile.firstName} ${profile.lastName}` : "User"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {profile ? profile.email : email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 mt-2 text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <FiLogOut className="mr-3" size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;