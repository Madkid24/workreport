//side bar

// components/Sidebar.js
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faInfoCircle, faToggleOn, faToggleOff, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ isDarkMode, toggleDarkMode, toggleSidebar, isSidebarOpen }) => (
  <>
    {/* Sidebar for desktop */}
    <div className={`hidden md:flex md:w-64 h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-[#ecf0f3]'} text-gray-500 flex flex-col shadow-lg`}>
      <div className="p-4 flex items-center justify-center">
        <Image src={isDarkMode ? "/cenlogo.jpg" : "/logo.png"} alt="Logo" className="h-22 w-60" width={240} height={88} />
      </div>
      <nav className="flex-1 mt-6">
        <ul className="space-y-6">
          <li><a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={faClock} className="w-6 h-6" /><span className="ml-2">Explore History</span></a></li>
          <li><a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6" /><span className="ml-2">Instructions</span></a></li>
          <li><a href="#" onClick={toggleDarkMode} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={isDarkMode ? faToggleOn : faToggleOff} className="w-6 h-6" /><span className="ml-2">Dark Mode</span></a></li>
          <li><a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={faSignOutAlt} className="w-6 h-6" /><span className="ml-2">Log Out</span></a></li>
        </ul>
      </nav>
    </div>

    {/* Mobile Sidebar */}
    {isSidebarOpen && (
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-800' : 'bg-[#ecf0f3]'} text-gray-500 flex flex-col shadow-lg z-40 md:hidden`}>
        <div className="p-4 flex items-center justify-between">
          <Image src={isDarkMode ? "/cenlogo.jpg" : "/logo.png"} alt="Logo" className="h-22 w-60" width={240} height={88} />
        </div>
        <nav className="flex-1 mt-6">
          <ul className="space-y-6">
            <li><a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={faClock} className="w-6 h-6" /><span className="ml-2">Explore History</span></a></li>
            <li><a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6" /><span className="ml-2">Instructions</span></a></li>
            <li><a href="#" onClick={toggleDarkMode} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={isDarkMode ? faToggleOn : faToggleOff} className="w-6 h-6" /><span className="ml-2">Dark Mode</span></a></li>
            <li><a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans"><FontAwesomeIcon icon={faSignOutAlt} className="w-6 h-6" /><span className="ml-2">Logout</span></a></li>
          </ul>
        </nav>
      </div>
    )}

    <button onClick={toggleSidebar} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-md shadow-md flex items-center justify-center">
      <FontAwesomeIcon icon={faBars} className="w-3 h-2" />
    </button>
  </>
);

export default Sidebar;
