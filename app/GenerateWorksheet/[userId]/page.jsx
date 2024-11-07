"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import { FaWandSparkles } from 'react-icons/fa6';
import { FaBars } from 'react-icons/fa';
import { CiMenuBurger } from "react-icons/ci";
import { RiMenu5Line } from "react-icons/ri";
import { AiOutlineClose } from 'react-icons/ai';
import { ImSpinner9 } from "react-icons/im";
import Image from 'next/image';
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
// import Sidebar from '../../../components/generateWorksheet/Sidebar';
import Modal from '../../../components/generateWorksheet/Modal';
import html2canvas from 'html2canvas';
import { fetchHistory, insertHistory, fetchUsers, updateQuestionDetails, fetchSubjectAndGradeFromQuestionID, fetchSubjectById, fetchGradeById } from '../../../components/generateWorksheet/Query';
import { usePathname, useSearchParams } from 'next/navigation';


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
  const [userId, setUserId] = useState(null);
  const [isHistoryListVisible, setIsHistoryListVisible] = useState(false);
  const [isInstructModalVisible, setIsInstructModalVisible] = useState(false); // State for modal visibility
  // const userId = "971944d1-31ea-4442-aea5-d71533ac3953"
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))// New state for typing simulation
  const filteredHistory = history.filter(item => item.content);
  const limitedHistory = sortedHistory.slice(0, 5);

  const pathname = usePathname(); // Get the current pathname

  // Extract userId from the pathname
  const extractedUserId = pathname.split('/').pop(); // Get the last segment of the URL

  useEffect(() => {
    if (extractedUserId) {
      setUserId(extractedUserId); // Set the userId state
      console.log(`User ID: ${extractedUserId}`);
    }
  }, [extractedUserId]);

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

  const handleExploreHistoryClick = () => {
    setIsHistoryListVisible(prev => !prev);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  const showInstructModal = () => {
    setIsInstructModalVisible(true);
  };

  const closeInstructModal = () => {
    setIsInstructModalVisible(false);
  };


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

          // Wrap each shuffled left label in double quotes and join with a comma
          const quotedShuffledLeftLabels = shuffledLeftLabels.map(label => `"${label}"`).join(', ');

          // Wrap each right label in double quotes and join with a comma
          const quotedRightLabels = rightLabels.map(label => `"${label}"`).join(', ');

          // Create answer pairs based on the original right labels using the shuffled left labels
          const matchPairs = shuffledLeftLabels.map((shuffledLeft, index) => {
            const originalIndex = leftLabels.indexOf(shuffledLeft); // Find the original index of the left label
            const correspondingRight = rightLabels[originalIndex]; // Get the corresponding right label
            return `${shuffledLeft} ⟷ ${correspondingRight}`; // Create the answer pair
          }).join('<br>');

          // Format the answer content with the question number and question text
          answerContent = `
          <b>Question ${item.QuestionNumber}:</b> Match the following -
          Left labels: [${quotedShuffledLeftLabels}] 
          Right labels: [${quotedRightLabels}] <br>
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

  }, [simulateTyping, updateQuestionDetails, userId]);


  const handleSelectFile = async (selectedItem) => {
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
              <img src="/assets/generateWorksheet/worksheettemplateheader.png" alt="Worksheet Header" class="w-full h-auto" />
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
          const leftLabels = leftLabelsMatch[1].match(/"(.*?)"(?=\s*,|\s*$)/g).map(label => label.replace(/"/g, '').trim());
          const rightLabels = rightLabelsMatch[1].match(/"(.*?)"(?=\s*,|\s*$)/g).map(label => label.replace(/"/g, '').trim());

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
              <img src="/assets/generateWorksheet/worksheettemplateheader.png" alt="Worksheet Header" class="w-full h-auto"/>
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
        downloadBtn.disabled = true;
        downloadBtn.innerText = 'Downloading';
        downloadBtn.style.cursor = 'not-allowed';

        const width = 210; // A3 width in mm
        const height = 370; // A3 height in mm
        const pdf = new jsPDF({ format: [width, height] });

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
    <div className='bg-red'>
      {/* <Sidebar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        history={limitedHistory}
        sortedHistory={sortedHistory}
        onSelectFile={handleSelectFile}
      /> */}

      {/* <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 p-2 py-2 bg-white text-black border rounded-md shadow-md flex items-center justify-center"
      >
        {isSidebarOpen ? (
          <AiOutlineClose className="w-5 h-5 text-black" /> // Close icon
        ) : (
          <RiMenu5Line className="w-5 h-5 text-black" /> // Bars icon
        )}
      </button> */}

      {!isEditorVisible && (
        <div className="relative flex items-center justify-center h-screen bg-white text-gray-800 overflow-hidden p-4 sm:p-8">
          {/* Full-Screen Background Image */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(/assets/generateWorksheet/untitled.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Background Overlay when dropdown is open */}
          {isHistoryListVisible && (
            <div
              onClick={() => setIsHistoryListVisible(false)}
              className="fixed inset-0 bg-black opacity-50 z-30 sm:hidden"
            ></div>
          )}

          {/* Modal for Instructions */}
          {isInstructModalVisible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div
                className={`p-6 md:p-8 rounded-lg shadow-lg w-[90%] md:w-[800px] max-h-[90vh] overflow-y-auto bg-white text-black
                  }`}
              >
                <h2
                  className={`text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center text-black
                    }`}
                >
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
                    onClick={closeInstructModal}
                    className="bg-blue-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow hover:bg-blue-600 transition duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="absolute top-6 left-10 flex space-x-8 text-[#274472] font-semibold text-sm z-40">
            {/* Dropdown Button for History */}
            <div className="relative">
              <button
                onClick={handleExploreHistoryClick}
                className="bg-white text-#2f4a5f px-4 py-2 rounded-md hover:bg-transparent hover:border-2 hover:border-[#1A3853] hover:text-[#2f4a5f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3853]"
              >
                HISTORY
              </button>

              {/* Dropdown List */}
              {isHistoryListVisible && (
                <ul className="absolute left-0 top-12 w-screen bg-white border border-gray-300 rounded-md shadow-lg z-50 p-2 sm:w-64 sm:left-auto sm:top-10 sm:p-4">
                  {limitedHistory.length > 0 ? (
                    limitedHistory.map(item => (
                      <li key={item.id} className="hover:bg-gray-100">
                        <button
                          type="button"
                          onClick={() => handleSelectFile(item)}
                          className="block w-full text-left px-4 py-2 text-gray-800 text-sm"
                        >
                          {`Generated Question - ${formatDate(item.updated_at)}`}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-600 px-4 py-2">No history available.</li>
                  )}
                </ul>
              )}
            </div>

            <button
              onClick={showInstructModal}
              className="bg-white text-#2f4a5f px-4 py-2 rounded-md hover:bg-transparent hover:border-2 hover:border-[#1A3853] hover:text-[#2f4a5f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3853]"
            >
              INFO
            </button>
          </div>

          {/* Icon Section */}
          <div className="absolute top-4 right-4 grid grid-cols-2 gap-2 opacity-10 sm:right-16 sm:gap-4 z-10">
            <img src="/assets/generateWorksheet/ai-cloud.png" alt="AI Icon" className="w-10 h-10 sm:w-12 sm:h-12" />
            <img src="/assets/generateWorksheet/ai.png" alt="AI Icon" className="w-10 h-10 sm:w-12 sm:h-12" />
            <img src="/assets/generateWorksheet/artificial-intelligence.png" alt="AI Icon" className="w-10 h-10 sm:w-12 sm:h-12" />
            <img src="/assets/generateWorksheet/ai-cloud.png" alt="AI Icon" className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          {/* Main Content Wrapper */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-center mt-1 sm:mt-2">
            {/* Robot Image for Mobile View */}
            <div className="flex-shrink-0 md:hidden flex justify-center items-center w-full h-full mb-4">
              <img
                src="/assets/generateWorksheet/robot.png"
                alt="Robot"
                className="h-[200px] sm:h-[260px] object-contain"
              />
            </div>

            {/* Text Section */}
            <div className="text-center md:text-center md:mr-6 md:flex md:flex-col md:items-center">
              <h1 className="text-[32px] md:text-[40px] font-bold text-[#4A4A4A] leading-tight">LET’S GENERATE</h1>
              <h2 className="text-[48px] md:text-[56px] font-extrabold text-[#1A3853] leading-none">WORKSHEET</h2>
              <br />
              <p className="text-[#4A4A4A] text-lg md:text-xl">
                Worksheet classroom activities in a few <br /> clicks using the power of{' '}
                <span className="font-semibold text-[#1A3853]">
                  CENTA<span className="text-[#318CE7]">i</span>
                </span>
              </p>
              <button
                className="mt-4 px-6 py-2 sm:px-8 sm:py-3 bg-[#1A3853] text-white text-lg font-semibold rounded-full hover:bg-[#274472]"
                onClick={handleGenerateClick} // Trigger the same function as the Generate button
              >
                Let’s get started!
              </button>
            </div>

            {/* Robot Image for Desktop View */}
            <div className="hidden md:block flex-shrink-0 ml-4">
              <img
                src="/assets/generateWorksheet/robot.png"
                alt="Robot"
                className="h-[350px] sm:h-[330px] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {isEditorVisible && (
        <div className="flex-1 py-4 sm:py-0 px-1 bg-white">
          <div className={`relative flex-1 overflow-auto rounded-lg p-2 max-h-[calc(100vh-40px)] ${isEditorDisabled ? 'editor-disabled' : ''}`}>
            <SunEditor
              setContents={content}
              setOptions={{
                height: '50%',
                minHeight: '200px',
                buttonList: [['subscript', 'superscript']],
                resizingBar: false,
              }}
              setDefaultStyle={`font-size: 16px; line-height: 1.5; background-color: ${isEditorDisabled ? '#ffffff' : '#ffffff'}; color: ${isEditorDisabled ? '#000000' : '#000000'};`}
              className="custom-editor h-full"
            />
            {isEditorDisabled && (
              <div className={`absolute inset-0 bg-white opacity-0 z-20`} />
            )}
            <div ref={contentRef} />
            <div className="absolute top-4 right-4 md:top-3 md:right-8 z-30 bg-white rounded-md flex space-x-2">

              {/* Trigger Print Button */}
              <button
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    printReport(); // Call the function after 3 seconds
                  }, 3000); // 3000 milliseconds = 3 seconds
                }}
                disabled={isEditorDisabled}
                className={`flex items-center px-3 py-1 md:px-4 md:py-2 bg-[#0c4b6e] text-white rounded-full shadow-sm text-sm md:text-base ${isEditorDisabled ? 'opacity-15 cursor-not-allowed' : 'opacity-100'
                  }`}
              >
                {loading ? (
                  <>
                    <ImSpinner9 spin="true" className="mr-2 animate-spin" />
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
                className={`flex items-center px-3 py-1 md:px-4 md:py-2 bg-blue-500 text-white rounded-full shadow-sm text-sm md:text-base ${isEditorDisabled ? 'opacity-15 cursor-not-allowed' : 'opacity-100'
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
                background-color: #f5f5f5;
              }

              .custom-editor .sun-editor-editable::-webkit-scrollbar {
                width: 12px;
              }

              .custom-editor .sun-editor-editable::-webkit-scrollbar-thumb {
                background-color: #888 !important;
                border-radius: 10px;
              }

              /* Firefox */
              .custom-editor .sun-editor-editable {
                scrollbar-color: #888 #f5f5f5;
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
        userId={userId}
      />
    </div>
  );
};

export default LandingPage;