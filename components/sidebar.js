import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faInfoCircle, faToggleOn, faToggleOff, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ isDarkMode, toggleDarkMode, toggleSidebar, isSidebarOpen, history, sortedHistory, onSelectFile }) => {
  const [isHistoryListVisible, setIsHistoryListVisible] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Function to show the modal
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Function to handle closing of the modal
  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleExploreHistoryClick = () => {
    setIsHistoryListVisible(prev => !prev);
  };


  return (
    <>
      {/* Sidebar for desktop */}
      <div className={`hidden md:flex md:w-64 h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-[#ecf0f3]'} text-gray-500 flex flex-col shadow-lg`}>
        <div className="p-4 flex items-center justify-center">
          <Image src={isDarkMode ? "/cenlogo.jpg" : "/logo.png"} alt="Logo" className="h-22 w-60" width={240} height={88} loading='lazy' />
        </div>
        <nav className="flex-1 mt-6">
          <ul className="space-y-6">
            <li>
              <a href="#" onClick={handleExploreHistoryClick} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={faClock} className="w-6 h-6" />
                <span className="ml-2">Explore History</span>
              </a>
              {isHistoryListVisible && (
                <ul className="ml-16 mt-2">
                  {history.map((item) => (
                    <li key={item.date} className="mb-4">
                      <a href="#" onClick={() => onSelectFile(item)}>
                        Generated Question
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li>
              <a href="#" onClick={showModal} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6" />
                <span className="ml-2">Instructions</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={toggleDarkMode} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={isDarkMode ? faToggleOn : faToggleOff} className="w-6 h-6" />
                <span className="ml-2">Dark Mode</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={faSignOutAlt} className="w-6 h-6" />
                <span className="ml-2">Log Out</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Mobile Sidebar */}
       {isSidebarOpen && (
        <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-800' : 'bg-[#ecf0f3]'} text-gray-500 flex flex-col shadow-lg z-40 md:hidden`}>
          <div className="p-4 flex items-center justify-between">
            <Image src={isDarkMode ? "/cenlogo.jpg" : "/logo.png"} alt="Logo" className="h-22 w-60" width={240} height={88} />
          </div>
          <ul className="space-y-6">
            <li>
              <a href="#" onClick={handleExploreHistoryClick} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={faClock} className="w-6 h-6" />
                <span className="ml-2">Explore History</span>
              </a>
              {isHistoryListVisible && (
                <ul className="ml-10 mt-2">
                  {history.map((item) => (
                    <li key={item.date} className="mb-4">
                      <a href="#" onClick={() => onSelectFile(item)}>
                        Generated Question
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li>
              <a href="#" onClick={showModal} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={faInfoCircle} className="w-6 h-6" />
                <span className="ml-2">Instructions</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={toggleDarkMode} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={isDarkMode ? faToggleOn : faToggleOff} className="w-6 h-6" />
                <span className="ml-2">Dark Mode</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
                <FontAwesomeIcon icon={faSignOutAlt} className="w-6 h-6" />
                <span className="ml-2">Log Out</span>
              </a>
            </li>
          </ul>
        </div>
      )}


      <button onClick={toggleSidebar} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-md shadow-md flex items-center justify-center">
        <FontAwesomeIcon icon={faBars} className="w-3 h-2" />
      </button>

      {/* Modal for Instructions */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`p-6 md:p-8 rounded-lg shadow-lg w-[90%] md:w-[800px] max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-black'}`}>
            <h2 className={`text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
              Instructions
            </h2>
            <ul className="list-disc pl-6 md:pl-8 space-y-3 md:space-y-4 text-base md:text-lg leading-relaxed text-left">
              <li>
                <strong>Step 1:</strong> Click on the &quot;Generate&quot; button, and a form will appear.
              </li>
              <li>
                <strong>Step 2:</strong> Fill out the complete form. Select the subject, then the grade from the dropdown, and finally the template. If you select &quot;default,&quot; you can click on the generate button. If you select &quot;custom,&quot; 10 additional fields will appear. Fill them out and click &quot;Generate&quot; again.
              </li>
              <li>
                <strong>Step 3:</strong> After clicking &quot;Generate,&quot; you&apos;ll be taken to the editor where the questions will be displayed. <em>Note:</em> The download and close buttons will be disabled until all questions are generated.
              </li>
              <li>
                <strong>Step 4:</strong> Once all the questions are generated, you can edit them as needed.
              </li>
              <li>
                <strong>Step 5:</strong> Finally, click the download button to generate a PDF with all the questions.
              </li>
            </ul>
            <div className="flex justify-end mt-4 md:mt-6">
              <button
                onClick={closeModal}
                className="bg-blue-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow hover:bg-blue-600 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
         </div>
      )}
    </>
  );
};

export default Sidebar;
