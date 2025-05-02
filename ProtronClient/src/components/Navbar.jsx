import { useState, useEffect, useRef } from "react";
import { FiHome, FiUser, FiUserCheck, FiFolder, FiClock, FiLogOut, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profile,setProfile] = useState(null)
  const email = sessionStorage.getItem("email")
  const userDropdownRef = useRef(null);
  const navigate = useNavigate()
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
      setIsMobile(window.innerWidth < 768);
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
        }); // adjust your endpoint if needed
        setProfile(res.data);
    } catch (error) {
        console.error("Error fetching profile", error);
    }
};
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
        !event.target.classList.contains("hamburger-button")
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
    // setActiveSection(section);
    if (isMobile) {
      setIsOpen(false);
    }
    navigate(`/${section}`); // Navigate to the selected section
  };
  const handleButtonClick = (email) => {
    toggleUserDropdown();
    handleProfileClick(email); // pass the correct email
};


  return (
    <div className="sticky top-0 z-50">
      {/* Main Navbar */}
      <div className="bg-green-900 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Left Side */}
            <div className="flex items-center gap-3">
              <img src="./logo.png" className="h-8 w-8" alt="Logo" />
              <span className="text-xl font-medium">ABC INC</span>
            </div>
            
            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-10">
                {[
                  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
                  { key: 'projects', label: 'Projects', path: '/projects' },
                  { key: 'team', label: 'Team', path: '/team' },
                  { key: 'timesheet', label: 'Timesheet', path: '/timesheet' },
                  { key: 'users', label: 'Users', path: '/users' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)} // Navigate using the path
                    className={`flex items-center px-3 py-2 rounded hover:underline cursor-pointer transition-colors duration-200 ${
                      window.location.pathname === item.path ? 'underline text-orange-500' : ''
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* User Profile - Right Side */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => handleButtonClick(email)}

                className="flex items-center px-3 py-2 rounded hover:bg-green-800 transition-colors duration-200"
              >
                <FiUser size={20} />
                <FiChevronDown className="ml-1" size={16} />
              </button>
              
              {/* User Dropdown */}
              {userDropdownOpen && profile && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                {/* User Profile Section */}
                <div className="px-5 py-4 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <span className="text-blue-600 text-lg font-semibold">
                        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{`${profile.firstName} ${profile.lastName}`}</div>
                      <div className="text-sm text-gray-500">{profile.email}</div>
                    </div>
                  </div>
                </div>
                
                {/* User Details Section */}
                <div className="px-5 py-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Employee Code:</div>
                    <div className="text-gray-700 font-medium">{profile.empCode}</div>
                    <div className="text-gray-500">Mobile:</div>
                    <div className="text-gray-700 font-medium">{profile.mobilePhone}</div>
                  </div>
                </div>
                
                {/* Actions Section */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-5 py-3 text-gray-700 hover:bg-gray-50 transition duration-150"
                  >
                    <FiLogOut className="mr-3 text-gray-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
              
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                className="hamburger-button text-white p-2 rounded-md"
                onClick={toggleNavbar}
                aria-label="Toggle menu"
              >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Dropdown */}
      {isMobile && (
        <div 
          className={`navbar-dropdown md:hidden bg-green-800 text-white overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-screen shadow-lg' : 'max-h-0'
          }`}
        >
          <div className="container mx-auto px-4 py-2">
            <nav>
              <ul className="space-y-1">
                {[
                  { key: 'dashboard', label: 'Dashboard' },
                  { key: 'projects', label: 'Projects'},
                  { key: 'team', label: 'Team' },
                  { key: 'timesheet', label: 'Timesheet' },
                  { key: 'users', label: 'Users' },
                ].map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => handleNavItemClick(item.key)}
                      className={`w-full text-left flex items-center px-2 py-3 rounded hover:bg-orange-500`
                        }
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
                <li className="border-t border-green-700 mt-2 pt-2">
                  <div className="px-2 py-3 text-sm">
                    <div className="font-medium">John Doe</div>
                    <div className="text-gray-300 text-xs">john.doe@example.com</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-2 py-3 text-left rounded hover:bg-orange-500 transition-colors duration-200"
                  >
                    <FiLogOut className="mr-3" />
                    <span>Logout</span>
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