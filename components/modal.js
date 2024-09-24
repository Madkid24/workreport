import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons';
import React, { useState, useEffect } from 'react';
import AlertBox from './alertBox';


const Modal = ({ isOpen, handleClose, handleGenerate, template, handleTemplateChange, onPrepareDownload }) => {
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [questionDetails, setQuestionDetails] = useState(
    Array.from({ length: 10 }).map((_, index) => ({
      questionNumber: (index + 1).toString(),  // Auto-fill question numbers from 1 to 10
      questionType: '',
      blooms: '',
      difficulty: '',
    }))
  );

  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  if (!isOpen) return null;

  const handleSubjectChange = (e) => setSubject(e.target.value);
  const handleGradeChange = (e) => setGrade(e.target.value);

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...questionDetails];
    updatedDetails[index][field] = value;
    setQuestionDetails(updatedDetails);
  };

  const resetForm = () => {
    setSubject('');
    setGrade('');
    handleTemplateChange({ target: { value: 'default' } });
    setQuestionDetails(
      Array.from({ length: 10 }).map((_, index) => ({
        questionNumber: (index + 1).toString(),
        questionType: '',
        blooms: '',
        difficulty: '',
      }))
    );
  };

  const handleFormSubmit = async () => {
    setLoading(true);
    const subject = document.getElementById('subject')?.value;
    const grade = parseInt(document.getElementById('grade')?.value, 10);
    const template = document.getElementById('template')?.value;

    if (!subject) {
      setAlertMessage('Subject is missing');
      setLoading(false);
      return;
    }

    if (isNaN(grade)) {
      setAlertMessage('Grade is missing');
      setLoading(false);
      return;
    }

    if (!template) {
      setAlertMessage('Template is missing');
      setLoading(false);
      return;
    }

    let workSheetDetails = [];

    if (template === 'custom') {
      let allFieldsFilled = true;

      workSheetDetails = questionDetails.filter(detail => detail.questionNumber);

      if (workSheetDetails.some(detail => !detail.questionType || !detail.blooms || !detail.difficulty)) {
        allFieldsFilled = false;
      }

      if (!allFieldsFilled) {
        setAlertMessage('Please fill all fields');
        setLoading(false);
        return;
      }
    }

    if (template === 'default') {
      workSheetDetails = [];
    }

    const formData = {
      subject,
      grade,
      template: template === 'custom' ? 'custom' : 'default',
      workSheetDetails,
    };

    console.log('Form Data:', formData);

    try {
      const aiAuthToken = process.env.NEXT_PUBLIC_AI_AUTH_TOKEN;
      console.log(process.env.NEXT_PUBLIC_BASE_URL, 'base url')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/worksheet/api/generate/971944d1-31ea-4442-aea5-d71533ac3953`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${aiAuthToken}`,
        },
        body: JSON.stringify(formData),
      });

      console.log(response, 'res');

      if (!response.ok) {
        setAlertMessage('cannot proceed with the request! please try again later!');
      }

      const responseData = await response.json();
      console.log('Response from backend:', responseData);

      const questionsArray = responseData?.content?.airesponse || responseData?.content?.response || [];
      // const questionsArray = [
      //   {
      //     QuestionNumber: 1,
      //     Question: 'What is the value of pi up to two decimal places?',
      //     Answer: '3.14',
      //     QuestionType: 'MCQ',
      //     QuestionTopic: 'Mensuration',
      //   },
      //   {
      //     QuestionNumber: 2,
      //     Question: 'Which of the following equations represents a linear relationship?',
      //     Answer: 'y = 3x + 2',
      //     QuestionType: 'MCQ',
      //     QuestionTopic: 'Linear Equations',
      //   },
      //   {
      //     QuestionNumber: 3,
      //     Question: 'Which of the following shapes has the largest area for a given perimeter?',
      //     Answer: 'Circle',
      //     QuestionType: 'MCQ',
      //     QuestionTopic: 'Areas of Plane Figures',
      //   },
      //   {
      //     QuestionNumber: 4,
      //     Question: 'If the roots of the quadratic equation ax^2 + bx + c = 0 are equal, which condition must hold?',
      //     Answer: 'b^2 - 4ac = 0',
      //     QuestionType: 'MCQ',
      //     QuestionTopic: 'Quadratic Equations',
      //   },
      //   {
      //     QuestionNumber: 5,
      //     Question: 'Calculate the value of x if 3x + 5 = 20.',
      //     Answer: '5',
      //     QuestionType: 'MCQ',
      //     QuestionTopic: 'Linear Equations',
      //   },
      //   {
      //     QuestionNumber: 6,
      //     Question: 'The area of a rectangle is given by the formula _____.',
      //     Answer: 'length × width',
      //     QuestionType: 'Fill in the blank',
      //     QuestionTopic: 'Mensuration',
      //   },
      //   {
      //     QuestionNumber: 7,
      //     Question: 'To design a garden in the shape of a circle with a radius of r, the area will be composed of _____ square meters.',
      //     Answer: 'πr^2',
      //     QuestionType: 'Fill in the blank',
      //     QuestionTopic: 'Areas of Plane Figures',
      //   },
      //   {
      //     QuestionNumber: 8,
      //     Question: 'Match the following: Left labels: [Circle, Square,…], internal angles: [360, sum of internal angles: 180]',
      //     Answer: ['Circle - 360', 'Square - 360'],
      //     QuestionType: 'Match the following',
      //     QuestionTopic: 'Geometric Shapes',
      //   },
      //   {
      //     QuestionNumber: 9,
      //     Question: 'Explain the Pythagorean theorem.',
      //     Answer: 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.',
      //     QuestionType: 'Short answer',
      //     QuestionTopic: 'Geometry',
      //   },
      //   {
      //     QuestionNumber: 10,
      //     Question: 'Design a triangle with a fixed perimeter of 30 cm. Ensure the triangle inequality holds.',
      //     Answer: 'To design a triangle with a fixed perimeter of 30 cm, select side lengths such as 10 cm, 10 cm, and 10 cm to satisfy these conditions.',
      //     QuestionType: 'Short answer',
      //     QuestionTopic: 'Geometry',
      //   },
      // ];
      console.log(questionsArray, "questarr")
      if (Array.isArray(questionsArray) && questionsArray.length > 0) {
        handleGenerate(questionsArray, subject, grade);
        onPrepareDownload(subject, grade, questionsArray);
        resetForm();
      }else{
        setAlertMessage("can't proceed with the request! please try again later!");
      }

    } catch (error) {
      console.error('Error submitting form data:', error);
      setAlertMessage('Something went wrong, Please regenerate again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        {alertMessage && (
          <AlertBox message={alertMessage} onClose={() => setAlertMessage('')} />
        )}
        <h2 className="text-xl font-semibold mb-4">Generate Worksheet</h2>
        <div className="mb-4">
          <label htmlFor="subject" className="block text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            id="subject"
            className="block w-full p-2 border border-gray-300 rounded-md"
            value={subject}
            onChange={handleSubjectChange}
            required
          >
            <option value="" disabled>Select Subject</option>
            <option value="English">English</option>
            <option value="Math">Math</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Social Science">Social Science</option>
            <option value="Political Science">Political Science</option>
            <option value="History">History</option>
            <option value="Geography">Geography</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="grade" className="block text-gray-700 mb-2">Grade <span className="text-red-500">*</span></label>
          <select id="grade" className="block w-full p-2 border border-gray-300 rounded-md" value={grade} onChange={handleGradeChange}>
            <option value="" disabled>Select Grade</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
            <option value="6">Grade 6</option>
            <option value="7">Grade 7</option>
            <option value="8">Grade 8</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="template" className="block text-gray-700 mb-2">Template <span className="text-red-500">*</span></label>
          <select
            id="template"
            className="block w-full p-2 border border-gray-300 rounded-md"
            value={template}
            onChange={handleTemplateChange}
          >
            <option value="default" selected>Default</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {template === 'custom' && (
          <div className="space-y-4 mb-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4">
                <div className="flex-1">
                  <label htmlFor={`question-no-${index}`} className="block text-gray-700 mb-2">Question No <span className="text-red-500">*</span></label>
                  <input
                    id={`question-no-${index}`}
                    type="text"
                    value={questionDetails[index].questionNumber}
                    readOnly
                    className="block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={`type-${index}`} className="block text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
                  <select id={`type-${index}`} className="block w-full p-2 border border-gray-300 rounded-md" value={questionDetails[index].questionType} onChange={(e) => handleDetailChange(index, 'questionType', e.target.value)}>
                    <option value="" disabled>Select Type</option>
                    <option value="Fill in the blank">Fill in the blank</option>
                    <option value="MCQ">MCQ</option>
                    <option value="Short answer">Short answer</option>
                    <option value="Match the following">Match the Following</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor={`difficulty-${index}`} className="block text-gray-700 mb-2">Difficulty <span className="text-red-500">*</span></label>
                  <select id={`difficulty-${index}`} className="block w-full p-2 border border-gray-300 rounded-md" value={questionDetails[index].difficulty} onChange={(e) => handleDetailChange(index, 'difficulty', e.target.value)}>
                    <option value="" disabled>Select Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor={`blooms-level-${index}`} className="block text-gray-700 mb-2">Blooms Level <span className="text-red-500">*</span></label>
                  <select id={`blooms-level-${index}`} className="block w-full p-2 border border-gray-300 rounded-md" value={questionDetails[index].blooms} onChange={(e) => handleDetailChange(index, 'blooms', e.target.value)}>
                    <option value="" disabled>Select Blooms Level</option>
                    <option value="Knowledge">Knowledge</option>
                    <option value="Understanding">Understanding</option>
                    <option value="Application">Application</option>
                    <option value="HOTS">HOTS</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 mr-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading} // Disable the button while loading
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                Generate
                <FontAwesomeIcon icon={faWandSparkles} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;