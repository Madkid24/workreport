import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons';
import React, { useState, useEffect } from 'react';
import AlertBox from './alertBox';
import { fetchGrades, fetchSubjects, fetchTopics } from './query';



const Modal = ({ isOpen, handleClose, handleGenerate, template, handleTemplateChange, onPrepareDownload }) => {
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectsFetched, setSubjectsFetched] = useState('');
  const [grade, setGrade] = useState('');
  const [grades, setGrades] = useState([]);
  const [gradesFetched, setGradesFetched] = useState('');
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState([]);
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

  const handleSubjectChange = async (e) => {
    const selectedSubject = e.target.value;
    const selectedSubjectName = subjects.find(subj => subj.id === selectedSubject).subject_name;
    setSubject(selectedSubject); // Set subject ID
    setSubjectsFetched(selectedSubjectName);
    setGrade(''); // Reset grade when subject changes
    setTopic('');
    setTopics([]); // Clear topics when subject changes
    await getGrades(); // Fetch grades based on selected subject
  };

  // Handle grade change
  const handleGradeChange = async (e) => {
    const selectedGrade = e.target.value;
    const selectedGradeName = grades.find(grd => grd.id === selectedGrade).grade_name;
    setGrade(selectedGrade); // Set grade ID
    setGradesFetched(selectedGradeName);
    setTopic('');
    await getTopics(subject, selectedGrade); // Fetch topics based on selected subject and grade
  };

  const handleTopicChange = (e) => setTopic(e.target.value);

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...questionDetails];
    updatedDetails[index][field] = value;
    setQuestionDetails(updatedDetails);
  };

  const getSubjects = async () => {
    try {
      const fetchedSubjects = await fetchSubjects();
      setSubjects(fetchedSubjects);
      // setSubjectsFetched(true); // Set to true after fetching
    } catch (err) {
      setAlertMessage('Error fetching subjects. Please try again.');
    }
  };

  const getGrades = async () => {
    try {
      const fetchedGrades = await fetchGrades();
      setGrades(fetchedGrades);
      // setGradesFetched(true);
    }catch (err) {
      setAlertMessage('Error fetching subjects. Please try again.');
    }
  };

  const getTopics = async (subjectId, gradeId) => {
    if (!subjectId || !gradeId) {
      setTopics([]); // Clear topics if subject or grade is not selected
      return;
    }
    
    try {
      const fetchedTopics = await fetchTopics(subjectId, gradeId); // Fetch topics based on subject and grade
      if (fetchedTopics.length === 0) {
        setTopics(null); // Set to null when no topics are mapped
      } else {
        setTopics(fetchedTopics); // Set fetched topics if they exist
      }
    } catch (err) {
      setAlertMessage('Error fetching topics. Please try again.');
    }
  };

  // Call this function when modal opens
  const handleModalOpen = () => {
    if (isOpen && !subject && !grade) {
      getSubjects(); // Fetch subjects when the modal opens
      getGrades();
    }
  };


  if (isOpen) {
    handleModalOpen(); // Fetch subjects when the modal is open
    // handleGradesOpen();
  }  

  const resetForm = () => {
    setSubject('');
    setGrade('');
    setTopic('');
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
    const subjectId = subject;
    const gradeId = grade; 
    const topic = document.getElementById('topic')?.value;
    const template = document.getElementById('template')?.value;

    if (!subjectId) {
      setAlertMessage('Subject is missing');
      setLoading(false);
      return;
    }

    if (!gradeId) {
      setAlertMessage('Grade is missing');
      setLoading(false);
      return;
    }

    if (!topic) {
      setAlertMessage('Topic is missing');
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
      subject: subjectId,
      grade: gradeId,
      topic,
      template: template === 'custom' ? 'custom' : 'default',
      workSheetDetails,
    };

    console.log('Form Data:', formData);

    try {
      const aiAuthToken = process.env.NEXT_PUBLIC_AI_AUTH_TOKEN;
      console.log(process.env.NEXT_PUBLIC_BASE_URL, 'base url')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/worksheet/generate/971944d1-31ea-4442-aea5-d71533ac3953`, {
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
      console.log(questionsArray, "questarr")
      if (Array.isArray(questionsArray) && questionsArray.length > 0) {
        handleGenerate(questionsArray, subject, grade);
        onPrepareDownload(subjectsFetched, gradesFetched, questionsArray);
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
          {subjects.map((subj) => (
            <option key={subj.id} value={subj.id}>{subj.subject_name}</option>
          ))}
        </select>
      </div>
        <div className="mb-4">
          <label htmlFor="grade" className="block text-gray-700 mb-2">Grade <span className="text-red-500">*</span></label>
          <select id="grade" className="block w-full p-2 border border-gray-300 rounded-md" value={grade} onChange={handleGradeChange}>
          <option value="" disabled>Select Grade</option>
            {grades.map((grd) => (
              <option key={grd.id} value={grd.id}>{grd.grade_name}</option> // Ensure this returns the option
            ))}
          </select>
        </div>
        <div className='mb-4'>
          <label htmlFor="topic" className='block text-gray-700 mb-2'>Topic <span className='text-red-500'>*</span></label>
          <select id="topic" className='block w-full p-2 border border-gray-300 rounded md' value={topic} onChange={handleTopicChange}>
          {topics === null ? (
            <option value="" disabled>No topic is mapped with the subject</option>
          ) : (
            <>
              <option value="" disabled>Select Topic</option>
              {topics.map((top) => (
                <option key={top.id} value={top.topic_name}>{top.topic_name}</option>
              ))}
            </>
          )}
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
                  <label htmlFor={`question-no-${index}`} className="block text-gray-700 mb-2">
                    Question No <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`question-no-${index}`}
                    type="text"
                    value={questionDetails[index].questionNumber}
                    readOnly
                    className="block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={`type-${index}`} className="block text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`type-${index}`}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    value={questionDetails[index].questionType}
                    onChange={(e) => handleDetailChange(index, 'questionType', e.target.value)}
                  >
                    <option value="" disabled>Select Type</option>
                    <option value="Fill in the blank">Fill in the blank</option>
                    <option value="MCQ">MCQ</option>
                    <option value="Short answer">Short answer</option>
                    <option value="Match the following">Match the Following</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor={`difficulty-${index}`} className="block text-gray-700 mb-2">
                    Difficulty <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`difficulty-${index}`}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    value={questionDetails[index].difficulty}
                    onChange={(e) => handleDetailChange(index, 'difficulty', e.target.value)}
                  >
                    <option value="" disabled>Select Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor={`blooms-level-${index}`} className="block text-gray-700 mb-2">
                    Blooms Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`blooms-level-${index}`}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    value={questionDetails[index].blooms}
                    onChange={(e) => handleDetailChange(index, 'blooms', e.target.value)}
                  >
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