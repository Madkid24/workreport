// page.js

"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandSparkles, faBars} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import Sidebar from '/components/sidebar';
import Modal from '/components/modal';

const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [template, setTemplate] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false); 
  const [content, setContent] = useState("");
  const contentRef = useRef(null);
  const [isEditorDisabled, setIsEditorDisabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('isDarkMode');
      return savedDarkMode ? savedDarkMode === 'true' : false;
    }
    return false; // Default value if localStorage is not available
  }); 

  const simulateTyping = useCallback((text, interval = 50) => {
    let index = 0;
    setIsEditorDisabled(true); // Disable editor before typing starts
    const typingInterval = setInterval(() => {
      setContent(prevContent => {
        const newContent = text.slice(0, index + 1);
        index += 1;
        if (index > text.length) {
          clearInterval(typingInterval);
          setIsEditorDisabled(false); // Enable editor after typing is done
          return newContent;
        }
        return newContent;
      });
    }, interval);
  }, []);
  

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [content]);

  const handleGenerateClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleTemplateChange = (event) => {
    setTemplate(event.target.value);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    // Optionally, you could store this in localStorage if you want to preserve the setting across sessions
    localStorage.setItem('isDarkMode', newDarkMode.toString());
};

const handleGenerate = useCallback((responseData) => {
  setIsModalOpen(false); // Close the modal
  setIsEditorVisible(true); // Show the SunTextEditor
  setContent(''); // Reset content
  // setIsEditorDisabled(true);

  const formattedContent = responseData
    .map(item => {
      let answerContent = '';

      if (item.QuestionType === 'Match the following') {
        // For "Match the following", format the left and right labels
        const matchPairs = item.Answer.map((pair, index) => {
          const leftLabel = pair[`${index + 1}_leftlabel`];
          const rightLabel = pair[`${index + 1}_rightlabel`];
          return `${leftLabel} ⟷ ${rightLabel}`;
        }).join('<br>');

        answerContent = `<b>Answer:</b><br>${matchPairs}`;
      } else {
        // For other question types, display the answer as it is
        answerContent = `<b>Answer:</b> ${item.Answer}`;
      }

      return `<div><b>Question ${item.QuestionNumber}:</b> ${item.Question}<br>${answerContent}</div><br>`;
    })
    .join('');

  // Start typing effect with formatted content
  simulateTyping(formattedContent);
}, [simulateTyping]);


  
  const downloadPDF = useCallback(async () => {
    const doc = new jsPDF();
    const logoSrc = '/logo.png'; // Adjust according to your dark mode logic
    const response = await fetch(logoSrc);
    const logoBlob = await response.blob();
    const reader = new FileReader();

    reader.onload = () => {
      const logoBase64 = reader.result;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const borderWidth = 1;
      const cornerRadius = 8;
      const borderColor = [0, 0, 0];
      const shadowColor = [0, 0, 0];
      const backgroundColor = '#ffffff';

      const addBorderAndBackground = () => {
        doc.setFillColor(backgroundColor);
        doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 'F');
        doc.setDrawColor(...shadowColor);
        doc.setLineWidth(borderWidth + 2);
        doc.roundedRect(margin - 3, margin - 3, pageWidth - margin * 2 + borderWidth + 6, pageHeight - margin * 2 + borderWidth + 6, cornerRadius, cornerRadius, 'S');
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(borderWidth);
        doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, cornerRadius, cornerRadius, 'S');
      };

      addBorderAndBackground();
      const logoWidth = 50;
      const logoHeight = 20;
      const xPosition = (pageWidth - logoWidth) / 2;
      const yPosition = margin + 10;

      doc.addImage(logoBase64, 'PNG', xPosition, yPosition, logoWidth, logoHeight);

      const titleGap = 20;
      doc.setFontSize(22);
      doc.setFont("Roboto", "bold");
      doc.setTextColor(84, 166, 248);
      doc.text("GENERATED QUESTIONS", pageWidth / 2, yPosition + logoHeight + titleGap, { align: 'center' });

      const editorContent = document.querySelector('.sun-editor-editable').innerText;
      const lineHeight = 6;
      let y = yPosition + logoHeight + titleGap + 20;
      let lines = doc.splitTextToSize(editorContent, pageWidth - margin * 2);

      doc.setFontSize(15);
      doc.setFont("Arial", "normal");
      doc.setTextColor(0, 0, 0);

      lines.forEach(line => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          addBorderAndBackground();
          y = margin + 20;
        }
        doc.text(line, margin + 10, y);
        y += 5;
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        doc.setFontSize(10);
        doc.setFont("Arial", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, margin / 2, { align: 'center' });
      }

      doc.save('questions.pdf');
    };

    reader.readAsDataURL(logoBlob);
  }, []);


  return (
    <div className={`flex ${isDarkMode ? 'bg-gray-900' : 'bg-white'} text-gray-900`}>
      <Sidebar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-md shadow-md flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faBars} className="w-3 h-2" />
      </button>

      {/* Main Content */}
      {!isEditorVisible &&  (
      <div className={`flex-1 p-4 md:p-6 flex flex-col ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <img src="centalogo1.png" alt="Logo" className="h-22 w-60" />
        </div>

        {/* Icon Section */}
        <div className="flex flex-wrap justify-between gap-4 mb-24">
          <div className="flex flex-col items-center mt-4">
            <img src="icon1.png" alt="Icon 1" className="h-20 w-20" />
            <p className="mt-2 text-center">Worksheet Generator</p>
          </div>
          <div className="flex flex-col items-center mt-4">
            <img src="icon2.png" alt="Icon 2" className="h-20 w-20" />
            <p className="mt-2 text-center">Worksheet Generator</p>
          </div>
          <div className="flex flex-col items-center mt-4">
            <img src="icon3.png" alt="Icon 3" className="h-20 w-20" />
            <p className="mt-2 text-center">Worksheet Generator</p>
          </div>
          <div className="flex flex-col items-center mt-4">
            <img src="icon4.png" alt="Icon 4" className="h-20 w-20" />
            <p className="mt-2 text-center">Worksheet Generator</p>
          </div>
        </div>

        {/* Fixed Text Box with Generate Button */}
        <div className={`flex flex-col md:flex-row items-center p-3 md:py-2 md:px-2 mt-8`}>
          <button
            type="button"
            onClick={handleGenerateClick}
            className="flex justify-center items-center cursor-pointer h-[35px] sm:h-[52px] rounded-full text-white px-[16px] py-5 sm:px-[16px] text-2xl sm:text-2xl font-bold sm:font-semibold mx-auto"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)',
              backgroundSize: '200% auto',
              animation: 'shine 2s linear infinite',
            }}
          >
            Generate
            <FontAwesomeIcon icon={faWandSparkles} className='ml-2' />
          </button>
          <style jsx>{`
              @keyframes shine {
                0% {
                  background-position: 0%;
                }
                50% {
                  background-position: 100%;
                }
                100% {
                  background-position: 0%;
                  }
                }
              `}</style>
            </div>
          </div>
        )}

      {isEditorVisible && (
        <div className="flex-1 py-4 px-1">
          <div className={`relative flex-1 overflow-auto rounded-lg p-2 max-h-[calc(100vh-40px)] ${isEditorDisabled ? 'editor-disabled' : ''}`}>
            <SunEditor
              setContents={content}
              setOptions={{
                height: '50%',
                minHeight: '200px',
                buttonList: [['subscript', 'superscript']],
                resizingBar: false,
              }}
              setDefaultStyle={`font-size: 16px; line-height: 1.5; background-color: ${isEditorDisabled ? (isDarkMode ? '#111827' : '#ffffff') : (isDarkMode ? '#111827' : '#ffffff')}; color: ${isEditorDisabled ? (isDarkMode ? '#d3d3d3' : '#000000') : (isDarkMode ? '#d3d3d3' : '#000000')};`}
              className="custom-editor h-full"
            />
            {isEditorDisabled && (
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} opacity-0 z-20`} />
            )}
            <div ref={contentRef} />
            <div className="absolute top-4 right-4 md:top-3 md:right-8 z-30 bg-white rounded-md flex space-x-2">
              <button
                onClick={downloadPDF}
                disabled={isEditorDisabled}
                className={`flex items-center px-3 py-1 md:px-4 md:py-2 bg-[#0c4b6e] text-white rounded-full shadow-sm text-sm md:text-base ${
                  isEditorDisabled ? 'opacity-15 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                }`}
              >
                Download PDF
              </button>
              <button
                onClick={() => setIsEditorVisible(false)}
                disabled={isEditorDisabled}
                className={`flex items-center px-3 py-1 md:px-4 md:py-2 bg-blue-500 text-white rounded-full shadow-sm text-sm md:text-base ${
                  isEditorDisabled ? 'opacity-15 cursor-not-allowed' : 'opacity-100'
                }`}
              >
                Close Editor
              </button>
            </div>
            <style jsx global>{`
              .editor-disabled {
                pointer-events: none;
                opacity: 1; /* Keep the editor's background color as set */
              }

              /* Webkit browsers */
              .custom-editor .sun-editor-editable::-webkit-scrollbar-track {
                -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
                background-color: ${isDarkMode ? '#2d2d2d' : '#f5f5f5'};
              }

              .custom-editor .sun-editor-editable::-webkit-scrollbar {
                width: 12px;
              }

              .custom-editor .sun-editor-editable::-webkit-scrollbar-thumb {
                background-color: ${isDarkMode ? '#555' : '#888'} !important;
                border-radius: 10px;
              }

              /* Firefox */
              .custom-editor .sun-editor-editable {
                scrollbar-color: ${isDarkMode ? '#555' : '#888'} ${isDarkMode ? '#2d2d2d' : '#f5f5f5'};
                scrollbar-width: thin;
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        handleClose={handleCloseModal}
        handleGenerate={handleGenerate}
        template={template}
        handleTemplateChange={handleTemplateChange}
        // selectedOptions={selectedOptions}
        // handleSelectChange={handleSelectChange}
      />
    </div>
  );
};

export default LandingPage;