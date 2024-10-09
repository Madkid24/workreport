import { useState } from 'react';
import Image from 'next/image';
import { FaClock, FaInfoCircle, FaToggleOn, FaToggleOff, FaSignOutAlt, FaBars } from 'react-icons/fa';

const Sidebar = ({ isDarkMode, toggleDarkMode, toggleSidebar, isSidebarOpen, history, sortedHistory, onSelectFile }) => {
  const [isHistoryListVisible, setIsHistoryListVisible] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
  
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  // const filteredHistory = history.filter(item => item.content);

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
          {/* <Image src={isDarkMode ? "/cenlogo.jpg" : "/logo.png"} alt="Logo" className="h-22 w-60" width={240} height={88}  priority /> */}
        </div>
        <nav className="flex-1 mt-24">
          <ul className="space-y-6">
            <li>
              <a href="#" onClick={handleExploreHistoryClick} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              <FaClock className="w-6 h-6" />
                <span className="ml-2">Explore History</span>
              </a>
              {isHistoryListVisible && (
                  <ul className="ml-16 mt-2">
                    {history.map(item => {
                      // Format the `updated_at` field
                      const formattedDate = formatDate(item.updated_at);

                      return (
                        <li key={item.id} className="mb-4">
                          <a href="#" onClick={() => onSelectFile(item)} className="text-md">
                            Generated Question - {formattedDate}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </li>
            <li>
              <a href="#" onClick={showModal} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              <FaInfoCircle className="w-6 h-6" />
                <span className="ml-2">Instructions</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={toggleDarkMode} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              {isDarkMode ? <FaToggleOn className="w-6 h-6" /> : <FaToggleOff className="w-6 h-6" />}
                <span className="ml-2">Dark Mode</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              <FaSignOutAlt className="w-6 h-6" />
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
            {/* <Image src={isDarkMode ? "/cenlogo.jpg" : "/logo.png"} alt="Logo" className="h-22 w-60" width={240} height={88} /> */}
          </div>
          <ul className="space-y-6">
            <li>
              <a href="#" onClick={handleExploreHistoryClick} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              <FaClock className="w-6 h-6" />
                <span className="ml-2">Explore History</span>
              </a>
              {isHistoryListVisible && (
                <ul className="ml-10 mt-2">
                  {history.map(item => {
                    const formattedDate = formatDate(item.updated_at);
                    return (
                    <li key={item.id} className="mb-4">
                      <a href="#" onClick={() => { onSelectFile(item); toggleSidebar();}} >
                        Generated Question - {formattedDate}
                      </a>
                    </li>
                    )
                  })}
                </ul>
              )}
            </li>
            <li>
              <a href="#" onClick={showModal} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              <FaInfoCircle className="w-6 h-6" />
                <span className="ml-2">Instructions</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={toggleDarkMode} className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              {isDarkMode ? <FaToggleOn className="w-6 h-6" /> : <FaToggleOff className="w-6 h-6" />}
                <span className="ml-2">Dark Mode</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-2 ml-8 hover:bg-gray-200 text-xl font-sans">
              <FaSignOutAlt className="w-6 h-6" />
                <span className="ml-2">Log Out</span>
              </a>
            </li>
          </ul>
        </div>
      )}

      <button onClick={toggleSidebar} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-md shadow-md flex items-center justify-center">
        <FaBars className="w-3 h-2" />
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
                <strong>Step 2:</strong> Fill out the complete form. Select the subject, grade, and topic from the dropdown, and then choose the template. If you select &quot;default,&quot; you can click on the generate button immediately. If you select &quot;custom,&quot; 10 additional fields will appear. Fill them out, then click &quot;Generate&quot; again. <em>Note:</em> While filling in the 10 additional fields, there is a limit on question type selection: You can choose only three questions each for MCQ and Fill in the Blank, and only two questions each for Short Answer and Match the Following.
              </li>
              <li>
                <strong>Step 3:</strong> After clicking &quot;Generate,&quot; you&apos;ll be taken to the editor where the questions and answers along with the topic, blooms level, difficulty level will be displayed. <em>Note:</em> The preview and close buttons will be disabled until all questions are generated.
              </li>
              <li>
                <strong>Step 4:</strong> Once all the questions are generated, you can edit them as needed.
              </li>
              <li>
                <strong>Step 5:</strong> Then, click on the preview button which will display the preview of your pdf and it will also have a cancel and download button.
              </li>
              <li>
                <strong>Step 6:</strong> Finally, click on download button to generate a pdf with all questions and answers. And in case you want to revert back to the editor and make some changes then you can click on the cancel button.
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
