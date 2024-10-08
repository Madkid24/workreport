// page.js

"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import { FaWandSparkles, FaSpinner } from 'react-icons/fa6';
import {FaBars} from 'react-icons/fa';
import { ImSpinner9 } from "react-icons/im";
import Image from 'next/image';
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import Sidebar from '/components/sidebar';
import Modal from '/components/modal';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { fetchHistory, insertHistory, fetchUsers, updateQuestionDetails, fetchSubjectAndGradeFromQuestionID,fetchSubjectById, fetchGradeById } from '/components/query';


const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const componentPdf = useRef(null);
  const [template, setTemplate] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false); 
  const [content, setContent] = useState("");
  const [pdfDetails, setPdfDetails] = useState({ subject: '', grade: null });
  const [questionsArray, setQuestionsArray] = useState(null);
  const contentRef = useRef(null);
  const [isEditorDisabled, setIsEditorDisabled] = useState(true);
  const [history, setHistory] = useState([]);
  // const [userId, setUserId] = useState(null);
  const userId = "971944d1-31ea-4442-aea5-d71533ac3953"
  const [selectedFileIndex, setSelectedFileIndex] = useState(null); 
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('isDarkMode');
      return savedDarkMode ? savedDarkMode === 'true' : false;
    }
    return false; // Default value if localStorage is not available
  }); 
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))// New state for typing simulation
  const filteredHistory = history.filter(item => item.content);
  const limitedHistory = sortedHistory.slice(0, 4);

  

  const simulateTyping = useCallback((text, interval = 30) => {
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
      contentRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [content]);

  // useEffect(() => {
  //   const getUsers = async () => {
  //     try {
  //       const userData = await fetchUsers();
  //       setUserId(userData[0].id);
  //     } catch(error) {
  //       console.error("Error fetching user id:", error);
  //     }
  //   };
  //   getUsers();
  // });

  useEffect(() => {
    // Only fetch history if userId is set and valid
    if (userId) {
      const getHistory = async () => {
        try {
          const historyData = await fetchHistory(userId);
          setHistory(historyData);
        } catch (error) {
          console.error("Error fetching history:", error);
        }
      };
  
      getHistory();
    }
  }, [userId]); 

  
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

const handleGenerate = useCallback(async (responseData, questionId) => {
  setIsModalOpen(false); // Close the modal
  setIsEditorVisible(true); // Show the SunTextEditor
  setContent(''); // Reset content

  // Fetch subject and grade based on the questionId
  const data = await fetchSubjectAndGradeFromQuestionID(questionId)
  const subject_id = data?.subject_id; // Use optional chaining for safety
  const grade_id = data?.grade_id;     // Correctly extracting grade_id

  const subject = subject_id ? await fetchSubjectById(subject_id) : null;
  const grade = grade_id ? await fetchGradeById(grade_id) : null;

  // Ensure responseData is parsed into an object before processing
  const parsedResponseData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

  const formattedContent = parsedResponseData
    .map(item => {
      let answerContent = '';

      if (item.QuestionType === 'Match the following') {
        // Extract left and right labels from the answer array
        const leftLabels = item.Answer.map((pair, index) => pair[`${index + 1}_leftlabel`]);
        const rightLabels = item.Answer.map((pair, index) => pair[`${index + 1}_rightlabel`]);

        // Shuffle left labels
        const shuffledLeftLabels = [...leftLabels].sort(() => Math.random() - 0.5);

        // Create answer pairs based on the original right labels using the shuffled left labels
        const matchPairs = shuffledLeftLabels.map((shuffledLeft, index) => {
          const originalIndex = leftLabels.indexOf(shuffledLeft); // Find the original index of the left label
          const correspondingRight = rightLabels[originalIndex]; // Get the corresponding right label
          return `${shuffledLeft} ⟷ ${correspondingRight}`; // Create the answer pair
        }).join('<br>');

        // Format the answer content with the question number and question text
        answerContent = `
          <b>Question ${item.QuestionNumber}:</b> Match the following -
          Left labels: [${shuffledLeftLabels.join(', ')}] 
          Right labels: [${rightLabels.join(', ')}], <br>
          <b>Answer:</b><br>${matchPairs}
        `;
      } else {
        // For other question types, display the answer as it is
        answerContent = `
          <b>Question ${item.QuestionNumber}:</b> ${item.Question}<br>
          <b>Answer:</b> ${item.Answer}
        `;
      }

      return `
        <div>
          <b>Topic:</b> ${item.QuestionTopic}<br>
          <b>Blooms Level:</b> ${item.BloomsLevel}<br>
          <b>Difficulty Level:</b> ${item.DifficultyLevel}<br>
          ${answerContent}  <!-- This includes the question number and question -->
        </div>
        <br>
      `;
    })
    .join('');

  try {
   
   // If the question ID exists, update the content, subject, and grade in the `questions` table
    if (questionId) {
      await updateQuestionDetails(questionId, formattedContent);
    } else {
      console.error("No question ID found in the response data.");
    }
  } catch (error) {
    console.error("Error updating question details:", error);
  }

  // Start typing effect with formatted content
  simulateTyping(formattedContent);

  const historyData = await fetchHistory(userId);
  setHistory(historyData);

}, [simulateTyping, updateQuestionDetails,userId]);


const handleSelectFile = async(selectedItem) => {
  if (selectedItem) {

    const { content, id: questionId, questions } = selectedItem;

    // Set content, subject, and grade from the selected item
    try {
      const data = await fetchSubjectAndGradeFromQuestionID(questionId)
      const subject_id = data?.subject_id; // Use optional chaining for safety
      const grade_id = data?.grade_id;     // Correctly extracting grade_id

      const subject = subject_id ? await fetchSubjectById(subject_id) : null;
      const grade = grade_id ? await fetchGradeById(grade_id) : null;

      // Update the content and PDF details
      setContent(content);
      setPdfDetails({ subject, grade });

      // Group the questions (if necessary)
      const groupedQuestions = {
        mcq: [],
        fillInTheBlank: [],
        match: [],
        shortAnswer: [],
      };

      const parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;

      if (parsedQuestions && parsedQuestions.length > 0) {
        parsedQuestions.forEach((question) => {
          switch (question.QuestionType) {
            case 'MCQ':
              groupedQuestions.mcq.push(question);
              break;
            case 'Fill in the blank':
              groupedQuestions.fillInTheBlank.push(question);
              break;
            case 'Match the following':
              groupedQuestions.match.push(question);
              break;
            case 'Short answer':
              groupedQuestions.shortAnswer.push(question);
              break;
            default:
              console.error(`Unknown question type: ${question.QuestionType}`);
          }
        });
      }

      setQuestionsArray(groupedQuestions);
      setIsEditorVisible(true);
      setIsEditorDisabled(false);

      console.log("Fetched Subject:", subject);
      console.log("Fetched Grade:", grade);

    } catch (error) {
      console.error('Error fetching subject or grade:', error);
    }
  } else {
    console.error("No item selected");
  }
};


    const handlePrepareDownload = (subject, grade, questions) => {
      setPdfDetails({ subject, grade });
      
      const groupedQuestions = {
        mcq: [],
        fillInTheBlank: [],
        match: [],
        shortAnswer: []
      };
    
      // Grouping questions by type
      if (questions && questions.length > 0) {
        questions.forEach(question => {
          if (question.QuestionType === 'MCQ' || question.QuestionType === 'Fill in the blank') {
            groupedQuestions.mcq.push(question);
          } else if (question.QuestionType === 'Match the following') {
            groupedQuestions.match.push(question);
          } else if (question.QuestionType === 'Short answer') {
            groupedQuestions.shortAnswer.push(question);
          }
        });
      }
    
      setQuestionsArray(groupedQuestions); // Update state with grouped questions
    };
    
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }).substring(0, 8); // Reducing to 8 characters
    };
  
    const extractQuestionsFromEditor = () => {
      const editorContent = document.querySelector('.sun-editor-editable').innerText;
      const lines = editorContent.split('\n');
      const extractedQuestions = {};
    
      lines.forEach(line => {
        const match = line.match(/Question (\d+):?\s*(.+)/); // Made the colon optional and allowed for extra spaces
        if (match) {
          const number = parseInt(match[1], 10);
          const text = match[2].trim(); // Trim whitespace
          extractedQuestions[number] = text;
          // console.log(`Extracted Question Number: ${number}`); 
        }
      });
    
      return extractedQuestions;
    };
    
    const extractAnswersFromEditor = () => {
      const editorContent = document.querySelector('.sun-editor-editable').innerText;
      const lines = editorContent.split('\n');
      const extractedAnswers = {};
      let currentQuestionNumber = null;
    
      lines.forEach((line, index) => {
        // Match for Question Number
        const questionMatch = line.match(/Question (\d+):/);
        if (questionMatch) {
          currentQuestionNumber = parseInt(questionMatch[1], 10);
        }
    
        // Match for Answer, allowing flexibility for starting characters
        const answerMatch = line.match(/Answer:\s*(.+)/);
        if (answerMatch && currentQuestionNumber !== null) {
          extractedAnswers[currentQuestionNumber] = answerMatch[1].trim();
          return; // Skip to the next iteration
        }
    
        // Handle Multi-line Answers for Match-the-Following
        if (currentQuestionNumber !== null && line.startsWith("Answer:")) {
          let answer = '';
          // Start capturing answers from the next line
          for (let i = index + 1; i < lines.length; i++) {
            const nextLine = lines[i].trim();
            if (nextLine === '' || nextLine.startsWith('Question')) {
              break; // Stop capturing if we hit a blank line or the next question
            }
            answer += `${nextLine}\n`; // Append the answer line
          }
          extractedAnswers[currentQuestionNumber] = answer.trim(); // Store trimmed answer
        }
      });
    
      // Replace undefined answers with 'N/A'
      for (let i = 1; i <= Object.keys(extractedAnswers).length; i++) {
        if (!extractedAnswers[i]) {
          extractedAnswers[i] = 'N/A';
        }
      }
    
      return extractedAnswers;
    };
    
 
    const processQuestionsArray = (questionsArray, editorQuestions, editorAnswers) => {
      const objectiveQuestions = [];
      const matchQuestions = [];
      const shortAnswerQuestions = [];
      const answers = [];
    
      // Process each category of questions
      for (const [key, questions] of Object.entries(questionsArray)) {
        questions.forEach(q => {
          const questionNumber = q.QuestionNumber;
          if (editorQuestions[questionNumber]) {
            const questionText = editorQuestions[questionNumber];
            switch (key) {
              case 'mcq':
              case 'fillInTheBlank':
                objectiveQuestions.push(` ${questionText}`);
                answers.push(` ${editorAnswers[questionNumber] || 'N/A'}`);
                break;
              case 'match':
                matchQuestions.push(` ${questionText}`); // Add the match question directly
                const matchAnswer = editorAnswers[questionNumber];
                if (matchAnswer && matchAnswer.includes('⟷')) {
                  const pairs = matchAnswer.split('\n').map(pair => pair.split('⟷').map(item => item.trim()));
                  const tableRows = pairs.map(([left, right]) => `<tr><td class="border px-4 py-2">${left}</td><td class="border px-4 py-2">${right}</td></tr>`).join('');
                  answers.push(`<table class="w-full mt-3 border-collapse"><thead><tr><th class="border px-4 py-2">Left Label</th><th class="border px-4 py-2">Right Label</th></tr></thead><tbody>${tableRows}</tbody></table>`);
                } else {
                  answers.push(` ${matchAnswer || 'N/A'}`);
                }
                break;
              case 'shortAnswer':
                shortAnswerQuestions.push(` ${questionText}`);
                answers.push(` ${editorAnswers[questionNumber] || 'N/A'}`);
                break;
              default:
                console.warn(`Unknown question category: ${key}`);
            }
          }
        });
      }
    
      return { objectiveQuestions, answers, matchQuestions, shortAnswerQuestions };
    };
    
    
    const printReport = () => {
      const uuid = generateUUID(); // Generate UUID for both questions and answers
    
      const editorQuestions = extractQuestionsFromEditor();
      const editorAnswers = extractAnswersFromEditor();
    
      const { objectiveQuestions, answers, matchQuestions, shortAnswerQuestions } = processQuestionsArray(
        questionsArray,
        editorQuestions,
        editorAnswers
      );

      // Filter answers to exclude short answers
      const filteredAnswers = answers.filter((answer, index) => {
        // Check if the current index is part of the indices of short answer questions
        return !shortAnswerQuestions.some((shortAnswer, shortIndex) => {
          return index === (objectiveQuestions.length + matchQuestions.length + shortIndex);
        });
      });
    
      const content = `
      <html>
        <head>
          <title>${pdfDetails.subject} Worksheet</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@latest/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: sans-serif;
            }
            .print-container {
              width: 100%; /* Full width for the content */
              max-width: 800px; /* Set a maximum width for the box */
              margin: 20px auto; /* Center the box */
              padding: 20px; /* Padding for the content */
              border: 1px solid #ccc; /* Add a border around the box */
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Optional shadow */
            }
            img {
              max-height: 150px; /* Reduce the height of images */
              width: auto; /* Maintain aspect ratio */
            }
          </style>
        </head>
        <body>
          <!-- Questions Box -->
          <div class="print-container" id="questions-container">
            <div class="relative text-center mb-5">
              <img src="/worksheettemplateheader.png" alt="Worksheet Header" class="w-full h-auto" />
              <div class="absolute top-1/4 left-1/2 transform -translate-x-1/4 -translate-y-1/3 text-white" style="font-size: 42px; font-weight: bold;">
                  W O R K S H E E T
              </div>
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/5 mt-3 text-white text-md"> <!-- Increased margin-top -->
                Worksheet ID: ${uuid}
              </div>
            </div>
    
            <h2 class="text-lg font-bold mb-1">Student Name:</h2>
            <div class="flex justify-between mb-2">
              <h2 class="text-lg font-bold">Grade: ${pdfDetails.grade}</h2>
              <h2 class="text-lg font-bold">Subject: ${pdfDetails.subject}</h2>
            </div>

            <div class="border-t-2 border-gray-800 my-4"></div>
    
            <h3 class="text-xl font-semibold mb-2">Objective Questions:</h3>
            <div>
              ${objectiveQuestions.map((question, index) => `${index + 1}. ${question}`).join('<br/>')}
            </div>
    
            ${matchQuestions.length > 0 ? `
              <h3 class="text-xl font-semibold mt-4 mb-2">Match the Following Questions:</h3>
              ${matchQuestions.map((question, index) => {
                const introText = question.split(' - ')[0];
                const leftLabelsMatch = question.match(/Left labels:\s*[\[\{](.*?)[\]\}]/);
                const rightLabelsMatch = question.match(/Right labels:\s*[\[\{](.*?)[\]\}]/);
                return `
                  <h4 class="mt-2">${objectiveQuestions.length + index + 1}. ${introText}</h4>
                  <table class="w-full mt-3 border-collapse">
                    <thead>
                      <tr>
                        <th class="border px-4 py-2 text-center">Left Label</th>
                        <th class="border px-4 py-2 text-center">Right Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${leftLabelsMatch && rightLabelsMatch ? (() => {
                        const leftLabels = leftLabelsMatch[1].split(',').map(label => label.trim());
                        const rightLabels = rightLabelsMatch[1].split(',').map(label => label.trim());
    
                        return leftLabels.map((leftLabel, index) => `
                          <tr>
                            <td class="border px-4 py-2">${leftLabel}</td>
                            <td class="border px-4 py-2">${rightLabels[index] || 'N/A'}</td>
                          </tr>
                        `).join('');
                      })() : ''}
                    </tbody>
                  </table>
                `;
              }).join('')}
            ` : ''}
    
            ${shortAnswerQuestions.length > 0 ? `
              <h3 class="text-xl font-semibold mt-4 mb-2">Short Answer Questions:</h3>
              <div>
                ${shortAnswerQuestions.map((question, index) => `${objectiveQuestions.length + matchQuestions.length + index + 1}. ${question}`).join('<br/>')}
              </div>
            ` : ''}
    
            <div class="border-t-2 border-gray-800 my-4"></div>
            <div class="text-left font-bold">Teacher's Signature:</div>
            <br /> <!-- Add this line for spacing -->
            <div class="w-full text-white text-center" style="background-color: #1a3546; height: 45px;">
                <span style="line-height: 30px;">This worksheet is generated by CENTAi | Date: ${new Date().toLocaleDateString()}</span>
              </div>
          </div>
    
          <!-- Answers Box -->
          <div class="print-container" id="answers-container">
            <div class="relative text-center mb-5">
              <img src="/worksheettemplateheader.png" alt="Worksheet Header" class="w-full h-auto"/>
              <div class="absolute top-1/4 left-1/2 transform -translate-x-1/4 -translate-y-1/3 text-white" style="font-size: 45px; font-weight: bold;">
                A N S W E R S
              </div>
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/5 mt-3 text-white text-md"> <!-- Increased margin-top -->
                Worksheet ID: ${uuid}
              </div>
            </div>
    
            <h3 class="text-xl font-semibold mb-2">Answers:</h3>
              <div>
              ${filteredAnswers.map((answer, index) => `<p>${index + 1}. ${answer}</p>`).join('')}
              </div>
              <br /> <!-- Add this line for spacing -->
              <div class="w-full text-white text-center" style="background-color: #1a3546; height: 45px;">
                <span style="line-height: 30px;">This worksheet is generated by CENTAi | Date: ${new Date().toLocaleDateString()}</span>
              </div>
          </div>
        </body>
      </html>
      `;
    
      const printWindow = window.open('', '_blank');
  printWindow.document.write(content);
  printWindow.document.close();

  printWindow.onload = () => {
    const downloadBtn = printWindow.document.createElement('button');
    downloadBtn.innerText = 'Download PDF';
    downloadBtn.style.position = 'fixed';
    downloadBtn.style.top = '10px';
    downloadBtn.style.right = '10px';
    downloadBtn.style.padding = '10px';
    downloadBtn.style.backgroundColor = '#1a3546';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.cursor = 'pointer';

    // Create a cancel button
    const cancelBtn = printWindow.document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    cancelBtn.style.position = 'fixed';
    cancelBtn.style.top = '10px';
    cancelBtn.style.right = '140px'; // Adjust position to be beside the download button
    cancelBtn.style.padding = '10px';
    cancelBtn.style.backgroundColor = '#ff0000'; // Red background for cancel button
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.cursor = 'pointer';

    printWindow.document.body.appendChild(downloadBtn);
    printWindow.document.body.appendChild(cancelBtn);

    downloadBtn.onclick = async () => {
      const width = 210; // A3 width in mm
      const height = 420; // A3 height in mm
      const pdf = new jsPDF({format: [width, height]});

      // Capture questions box as image
      const questionsContainer = printWindow.document.getElementById('questions-container');
      const questionsImage = await html2canvas(questionsContainer);
      const questionsDataUrl = questionsImage.toDataURL('image/png');

      // Add questions page with image
      pdf.addImage(questionsDataUrl, 'PNG', 10, 10, 190, 0);
      pdf.addPage();

      // Capture answers box as image
      const answersContainer = printWindow.document.getElementById('answers-container');
      const answersImage = await html2canvas(answersContainer);
      const answersDataUrl = answersImage.toDataURL('image/png');

      // Add answers page with image
      pdf.addImage(answersDataUrl, 'PNG', 10, 10, 190, 0);
      
      // Save the PDF
      pdf.save(`worksheet_${uuid}.pdf`);

      printWindow.close();
      setLoading(false);

      // alert('PDF downloaded successfully!');
    };

    // Close the print window when the cancel button is clicked
    cancelBtn.onclick = () => {
      printWindow.close();
      setLoading(false);
    };
  };
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
        <FaBars className="w-3 h-2" />
      </button>

      {/* Main Content */}
      {!isEditorVisible &&  (
      <div className={`flex-1 p-4 md:p-6 flex flex-col ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <img src="centalogo1.png" alt="Logo" className="h-22 w-60" />
        </div>

        {/* Icon Section */}
        <div className="flex flex-wrap justify-between gap-12 mb-24">
          <div className="flex flex-col items-center mt-4 w-1/4 md:w-auto">
            <img src="icon1.png" alt="Icon 1" className="h-20 w-20" />
            {/* <p className="mt-2 text-center">Worksheet Generator</p> */}
          </div>
          <div className="flex flex-col items-center mt-4 w-1/4 md:w-auto">
            <img src="icon2.png" alt="Icon 2" className="h-20 w-20" />
            {/* <p className="mt-2 text-center">Worksheet Generator</p> */}
          </div>
          <div className="flex flex-col items-center mt-4 w-1/4 md:w-auto">
            <img src="icon3.png" alt="Icon 3" className="h-20 w-20" />
            {/* <p className="mt-2 text-center">Worksheet Generator</p> */}
          </div>
          <div className="flex flex-col items-center mt-4 w-1/4 md:w-auto">
            <img src="icon4.png" alt="Icon 4" className="h-20 w-20" />
            {/* <p className="mt-2 text-center">Worksheet Generator</p> */}
          </div>
        </div>

        {/* <div className="flex justify-center items-center mt-2">
  <h1 className="text-center text-6xl font-italic text-blue-900">Worksheet Generator</h1>
</div> */}

        {/* Fixed Text Box with Generate Button */}
        <div className={`flex flex-col md:flex-row items-center p-3 md:py-2 md:px-2 mt-12`}>
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
            <FaWandSparkles className='ml-2' />
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
            

            {/* Trigger Print Button */}
            <button
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    printReport(); // Call the function after 3 seconds
                  }, 1000); // 3000 milliseconds = 3 seconds
                }}
                disabled={isEditorDisabled}
                className={`flex items-center px-3 py-1 md:px-4 md:py-2 bg-[#0c4b6e] text-white rounded-full shadow-sm text-sm md:text-base ${
                  isEditorDisabled ? 'opacity-15 cursor-not-allowed' : 'opacity-100'
                }`}
            >
              {loading ? (
              <>
                <ImSpinner9 spin className="mr-2" />
              </>
            ) : (
              <>
                Preview PDF
              </>
            )}
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