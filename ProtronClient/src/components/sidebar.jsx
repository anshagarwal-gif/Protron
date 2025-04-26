import { useState, useEffect } from "react";
import { FiHome, FiUser, FiUserCheck, FiFolder, FiClock, FiLogOut, FiMenu } from "react-icons/fi";

const Sidebar = ({ activeSection, setActiveSection, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector(".sidebar-main");
      if (
        isMobile && 
        isOpen && 
        sidebar && 
        !sidebar.contains(event.target) && 
        !event.target.classList.contains("hamburger-button")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavItemClick = (section) => {
    setActiveSection(section);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 z-20" onClick={() => setIsOpen(false)} />
      )}
      
      {/* Sidebar */}
      <div 
        className={`sidebar-main fixed md:static flex flex-col h-screen bg-green-900 text-white w-72 py-4 overflow-auto z-20 transition-all duration-300 ${
          isMobile ? (isOpen ? "left-0" : "-left-80") : ""
        }`}
      >
        <div className="px-4 mb-6 flex justify-center items-center gap-5 text-center border-b border-blue-300 pb-6">
          <img src="./logo.png" className="h-10 w-10" alt="Logo" />
          <span className="text-2xl font-medium">ABC INC</span>
        </div>

        <nav className="flex-1">
          <div className="px-4 mb-4">
            <h2 className="text-xs uppercase tracking-wider text-gray-300 mb-2">Menu</h2>
            <ul>
              {[
                { key: 'dashboard', label: 'Dashboard', icon: <FiHome className="mr-3" /> },
                { key: 'projects', label: 'Manage Projects', icon: <FiFolder className="mr-3" /> },
                { key: 'team', label: 'Manage Team', icon: <FiUser className="mr-3" /> },
                { key: 'timesheet', label: 'Manage Timesheet', icon: <FiClock className="mr-3" /> },
                { key: 'users', label: 'User Management', icon: <FiUserCheck className="mr-3" /> },
              ].map((item) => (
                <li key={item.key} className="mb-2">
                  <button
                    onClick={() => handleNavItemClick(item.key)}
                    className={`w-full text-left flex items-center px-2 py-2 rounded hover:bg-orange-500 ${
                      activeSection === item.key ? 'bg-orange-500' : ''
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mt-auto px-4 pt-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-2 py-3 text-left rounded bg-green-900 hover:bg-orange-500 transition-colors duration-200"
          >
            <FiLogOut className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Hamburger Menu Button */}
      {isMobile && !isOpen && (
        <button 
          className="hamburger-button fixed top-4 left-4 z-30 md:hidden bg-green-900 text-white p-2 rounded-md shadow-md"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <FiMenu size={24} />
        </button>
      )}

      {/* Content padding for mobile when sidebar is hidden */}
      {isMobile && (
        <div className="md:hidden h-16"></div>
      )}
    </>
  );
};

export default Sidebar;