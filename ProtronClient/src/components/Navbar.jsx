import { useState, useEffect, useRef } from "react";
import { FiHome, FiUser, FiUserCheck, FiFolder, FiClock, FiLogOut, FiMenu, FiX, FiChevronDown } from "react-icons/fi";

const Navbar = ({ activeSection, setActiveSection, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

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
    setActiveSection(section);
    if (isMobile) {
      setIsOpen(false);
    }
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
                  { key: 'dashboard', label: 'Dashboard' },
                  { key: 'projects', label: 'Projects' },
                  { key: 'team', label: 'Team'},
                  { key: 'timesheet', label: 'Timesheet'},
                  { key: 'users', label: 'Users' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavItemClick(item.key)}
                    className={`flex items-center px-3 py-2 rounded hover:bg-orange-500 transition-colors duration-200 ${
                      activeSection === item.key ? 'bg-orange-500' : ''
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
                onClick={toggleUserDropdown}
                className="flex items-center px-3 py-2 rounded hover:bg-green-800 transition-colors duration-200"
              >
                <FiUser size={20} />
                <FiChevronDown className="ml-1" size={16} />
              </button>
              
              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                    <div className="font-medium">John Doe</div>
                    <div className="text-gray-500">john.doe@example.com</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-2" />
                    <span>Logout</span>
                  </button>
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
                      className={`w-full text-left flex items-center px-2 py-3 rounded hover:bg-orange-500 ${
                        activeSection === item.key ? 'bg-orange-500' : ''
                      }`}
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