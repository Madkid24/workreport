// page.js

"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const [pdfDetails, setPdfDetails] = useState({ subject: '', grade: null });
  const [questionsArray, setQuestionsArray] = useState(null);
  const contentRef = useRef(null);
  const [isEditorDisabled, setIsEditorDisabled] = useState(true);
  const [history, setHistory] = useState(() => {
  if (typeof window !== 'undefined') {
    // Load history from localStorage on the client side
    const savedHistory = localStorage.getItem('history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  }
  return []; // Return an empty array on the server side
});
  const [selectedFileIndex, setSelectedFileIndex] = useState(null); 
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('isDarkMode');
      return savedDarkMode ? savedDarkMode === 'true' : false;
    }
    return false; // Default value if localStorage is not available
  }); 
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))// New state for typing simulation

  const limitedHistory = sortedHistory.slice(0, 5);

  const simulateTyping = useCallback((text, interval = 50) => {
    let index = 0;
    setIsEditorDisabled(true); // Disable editor before typing starts
    const typingInterval = setInterval(() => {
      setContent(prevContent => {
        const newContent = text.slice(0, index + 1);
        index += 1;
        if (index > text.length) {
          clearInterval(typingInterval);
          setIsEditorDisabled(false); // Enable editor after typing is done //
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
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('history', JSON.stringify(history));
      console.log('History updated:', history);
    }
  }, [history]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    // Optionally, you could store this in localStorage if you want to preserve the setting across sessions
    localStorage.setItem('isDarkMode', newDarkMode.toString());
};

const handleGenerate = useCallback((responseData, subject, grade) => {
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
  setHistory(prevHistory => [...prevHistory, { date: new Date(), content: formattedContent, subject, grade }]);
  }, [simulateTyping]);
  const handleSelectFile = (selectedItem) => {
    if (selectedItem) {
      console.log('Selected Item:', selectedItem);
      // Use an empty array if questionsArray is not present
      const questionsArray = selectedItem.questionsArray ;
      console.log('Questions Array:', questionsArray);
  
      setContent(selectedItem.content); // Use content from the selected item
      setQuestionsArray(questionsArray); // Set questionsArray
  
      setIsEditorVisible(true);
      setIsEditorDisabled(false);
    }
  };
  
  
  

  const downloadPDF = useCallback(async (subject, grade, questionsArray) => {
    const doc = new jsPDF();
    const imageSrc = '/worksheettemplateheader.png';
    const response = await fetch(imageSrc);
    const imageBlob = await response.blob();
    const reader = new FileReader();

    reader.onload = () => {
        const imageBase64 = reader.result;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const footerHeight = 10; // Height for the footer

        const generateUUID = () => {
            return 'xxxxxxxx'.replace(/[x]/g, (c) => {
                const r = Math.random() * 16 | 0;
                return r.toString(16);
            });
        };

        const uuid = generateUUID();

        const addImageHeader = (title) => {
            doc.addImage(imageBase64, 'PNG', 0, 0, pageWidth, 40); 
            const xOffset = 80;
            const titleY = 20;
            const uuidY = 30;
            const uuidoffset = 90;

            doc.setFontSize(30);
            doc.setFont("Arial", "bold");
            doc.setTextColor(255, 255, 255); 
            doc.text(title, xOffset, titleY); 

            const text = `WORKSHEET ID: ${uuid}`;
            doc.setFontSize(12);
            doc.setFont("Arial", "normal");
            doc.setTextColor(255, 255, 255); 
            doc.text(text, uuidoffset, uuidY);
        };

        const addFooter = (pageNum, totalPages) => {
            const footerY = pageHeight - footerHeight;

            doc.setFillColor(27, 50, 65); // Dark blue color
            doc.rect(0, footerY, pageWidth, footerHeight, 'F');

            doc.setFontSize(12);
            doc.setFont("Arial", "normal");
            doc.setTextColor(255, 255, 255);

            const footerText = 'This worksheet is generated by CENTAi';
            const dateText = new Date().toLocaleDateString();

            doc.text(footerText, 10, footerY + 7); // Powered by text on the left
            doc.text(dateText, pageWidth - 30, footerY + 7); // Date on the right
        };

        const addAdditionalInfo = (isFirstPage) => {
            if (isFirstPage) {
                const marginTop = 50;
                const marginLeft = 10; 
                const labelWidth = 60; 
                const spacing = 20; 

                doc.setFontSize(16);
                doc.setFont("Arial", "bold");
                doc.setTextColor(0, 0, 0);

                doc.text('Student Name:', marginLeft, marginTop);
                doc.text(`Grade: ${grade}`, marginLeft, marginTop + 10);  // Dynamic grade
                doc.text(`Subject: ${subject}`, marginLeft + 1 * (labelWidth + spacing), marginTop + 10); // Dynamic subject

                doc.setLineWidth(0.5);
                doc.line(marginLeft, marginTop + 15, pageWidth - marginLeft, marginTop + 15);
            }
        };

        const addTeacherSignature = () => {
            const lineY = pageHeight - 25; // Position the horizontal line
            doc.setLineWidth(0.5);
            doc.line(10, lineY, pageWidth - 10, lineY); // Horizontal line

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('Teacher Signature:', 10, lineY + 10); // Add "Teacher Signature:" text
        };

        const addSectionContent = (title, content, yOffset) => {
            doc.setFontSize(14);
            doc.setFont("Arial", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(title, 10, yOffset);

            doc.setFontSize(14);
            doc.setFont("Arial", "normal");
            doc.setTextColor(0, 0, 0);

            let y = yOffset + 8;
            const lineHeight = 7;
            const margin = 10;
            const maxLineWidth = pageWidth - 2 * margin;

            content.forEach(item => {
                const textLines = doc.splitTextToSize(item, maxLineWidth);

                textLines.forEach(textLine => {
                    if (y + lineHeight > pageHeight - footerHeight - 20) { // Account for footer
                        doc.addPage();
                        addImageHeader("WORKSHEET");
                        addAdditionalInfo(false); // Do not add additional info on new pages
                        addTeacherSignature(); // Add the horizontal line and teacher signature
                        y = 50; // Reset position for new page
                    }
                    doc.text(textLine, margin, y);
                    y += lineHeight;
                });
            });

            // Add a gap of one line after the section
            y += lineHeight;

            return y; // Return the next available y position
        };

        const extractQuestionsFromEditor = () => {
            const editorContent = document.querySelector('.sun-editor-editable').innerText;
            const lines = editorContent.split('\n');
            const extractedQuestions = {};

            lines.forEach(line => {
                const match = line.match(/Question (\d+): (.+)/);
                if (match) {
                    const number = parseInt(match[1], 10);
                    const text = match[2];
                    extractedQuestions[number] = text;
                }
            });

            return extractedQuestions;
        };

        const processQuestionsArray = (questionsArray) => {
            const objectiveQuestions = [];
            const matchQuestions = [];
            const shortAnswerQuestions = [];

            const editorQuestions = extractQuestionsFromEditor();

            questionsArray.forEach(q => {
                if (q.QuestionType === 'MCQ' || q.QuestionType === 'Fill in the blank') {
                    if (editorQuestions[q.QuestionNumber]) {
                        objectiveQuestions.push(`${q.QuestionNumber}. ${editorQuestions[q.QuestionNumber]}`);
                    }
                } else if (q.QuestionType === 'Match the following') {
                    if (editorQuestions[q.QuestionNumber]) {
                        matchQuestions.push(`${q.QuestionNumber}. ${editorQuestions[q.QuestionNumber]}`);
                    }
                } else if (q.QuestionType === 'Short answer') {
                    if (editorQuestions[q.QuestionNumber]) {
                        shortAnswerQuestions.push(`${q.QuestionNumber}. ${editorQuestions[q.QuestionNumber]}`);
                    }
                }
            });

            return { objectiveQuestions, matchQuestions, shortAnswerQuestions };
        };

        // Extract questions and answers
        const { objectiveQuestions, matchQuestions, shortAnswerQuestions } = processQuestionsArray(questionsArray);

        let isFirstPage = true;
        addImageHeader("W O R K S H E E T");
        addAdditionalInfo(isFirstPage);
        addTeacherSignature(); // Add the horizontal line and teacher signature

        let yOffset = 80; // Initial offset for content
        yOffset = addSectionContent("OBJECTIVE QUESTIONS", objectiveQuestions, yOffset);
        yOffset = addSectionContent("MATCH THE FOLLOWING QUESTIONS", matchQuestions, yOffset);
        yOffset = addSectionContent("SHORT ANSWER QUESTIONS", shortAnswerQuestions, yOffset);

        // Preserve the existing "ANSWERS" content and format it as needed
        doc.addPage();
      addImageHeader("A N S W E R S");

      const editorContent = document.querySelector('.sun-editor-editable').innerText;
      const lines = editorContent.split('\n');
      const answers = [];
      let currentAnswer = [];
      let isAnswer = false;
      let isMatchTheFollowing = false; // Flag for "Match the Following"
      let matchQuestionIndices = []; // Array to track indices of questions with "Match the Following"
      let tableRows = []; // Array to store rows for the current table
      let currentY = 50; // Initial Y position for answers

      // const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const maxLineWidth = pageWidth - 2 * margin; // Calculate the maximum width for text lines

      // Process each line to extract questions, answers, and "Match the Following" data
      lines.forEach((line, index) => {
          if (line.startsWith('Question')) {
              // Push the current answer before starting a new question
              if (currentAnswer.length > 0) {
                  answers.push({ text: currentAnswer.join('\n').trim(), index: matchQuestionIndices[matchQuestionIndices.length - 1], rows: tableRows });
                  currentAnswer = [];
                  tableRows = []; // Clear tableRows for the next question
              }
              isAnswer = false;
              isMatchTheFollowing = line.includes("Match"); // Detect if it's "Match the Following"

              if (isMatchTheFollowing) {
                  matchQuestionIndices.push(index); // Track the question index for table
              }
          } else if (line.startsWith('Answer:')) {
              isAnswer = true;
              currentAnswer.push(line.replace('Answer:', '').trim());
          } else if (isAnswer) {
              if (line.includes('⟷') && isMatchTheFollowing) {
                  const parts = line.split('⟷').map(part => part.trim());
                  if (parts.length === 2) {
                      tableRows.push([parts[0], parts[1]]);
                  }
              } else {
                  currentAnswer.push(line.trim()); // Add normal text to the current answer
              }
          }
      });

      // Push the last answer to the answers array
      if (currentAnswer.length > 0) {
          answers.push({ text: currentAnswer.join('\n').trim(), index: matchQuestionIndices[matchQuestionIndices.length - 1], rows: tableRows });
      }

      // Add the answers and tables to the PDF
      answers.forEach((answer, index) => {
        // Split the answer text into multiple lines to wrap within the page
        const wrappedText = doc.splitTextToSize(`${index + 1}) ${answer.text}`, maxLineWidth);
    
        // Check if we need to add a new page before adding the answer text
        if (currentY + wrappedText.length * 10 > doc.internal.pageSize.height - 30) {
            doc.addPage();
            currentY = 20; // Reset Y position on the new page
        }
    
        doc.setTextColor(0, 0, 0); // Set text color to black
    
        // Add the wrapped answer text line by line
        wrappedText.forEach(line => {
            doc.text(line, margin, currentY);
            currentY += 10; // Move Y position down after each line
        });
    
        // Check if the answer has a "Match the Following" table
        if (answer.rows.length > 0) {
            const tableStartY = currentY + 5; // Add a 1-line gap before the table
    
            // Check if the table fits on the current page, otherwise add a new page
            if (tableStartY + 10 > doc.internal.pageSize.height - 30) {
                doc.addPage();
                currentY = 20; // Reset Y position on the new page
            }
    
            doc.autoTable({
                startY: currentY, // Use currentY to start the table at the right position
                head: [['Left Column', 'Right Column']], // Table headers
                body: answer.rows, // Rows for the current table
                didDrawPage: (data) => {
                    currentY = data.cursor.y+2; // Update currentY after the table
                }
            });
    
            // Ensure consistent spacing after the table (1-line gap)
            currentY += 5;
        }
    
        // Check if we need to add a new page before the next answer
        if (currentY > doc.internal.pageSize.height - 30) {
            doc.addPage();
            currentY = 20; // Reset Y position on the new page
        }
    });
    
    // Add footers to each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        addFooter(pageNum, totalPages); // Add footer to each page
    }
    
    doc.save('questions_and_answers.pdf');
    

    
    
      };
          reader.readAsDataURL(imageBlob);
      }, []); // Ensure questionsArray is up-to-date



  const handlePrepareDownload = (subject, grade, questions) => {
    // Log the parameters to the console
    console.log('Subject:', subject);
    console.log('Grade:', grade);
    console.log('Questions Array:', questions);

    // Set the PDF details and questions array in state
    setPdfDetails({ subject, grade });
    setQuestionsArray(questions);
};


  return (
    <div className={`flex ${isDarkMode ? 'bg-gray-900' : 'bg-white'} text-gray-900`}>
      <Sidebar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        history={limitedHistory}
        sortedHistory={sortedHistory}
        onSelectFile={handleSelectFile}
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
                onClick={() => downloadPDF(pdfDetails.subject, pdfDetails.grade, questionsArray)}
                disabled={isEditorDisabled || !questionsArray || questionsArray.length === 0}
                className={`flex items-center px-3 py-1 md:px-4 md:py-2 bg-[#0c4b6e] text-white rounded-full shadow-sm text-sm md:text-base ${
                  isEditorDisabled || !questionsArray || questionsArray.length === 0 ? 'opacity-0 cursor-not-allowed' : 'opacity-100 cursor-pointer'
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
        onPrepareDownload={handlePrepareDownload} 
      />
    </div>
  );
};

export default LandingPage;