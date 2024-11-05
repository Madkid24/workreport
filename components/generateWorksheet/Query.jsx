// components/query.js
import { GraphQLClient, gql } from 'graphql-request';

const endpoint = process.env.NEXT_PUBLIC_DATABASE_URL; // Ensure this is set correctly to your GraphQL endpoint
const passkey = process.env.NEXT_PUBLIC_DATABASE_PASS; // This should be your admin secret

const client = new GraphQLClient(endpoint, {
  headers: {
    "Content-Type": "application/json",
    "x-hasura-admin-secret": passkey, // Make sure to set the header key correctly for Hasura
  },
});

// Get User
export const fetchUsers = async () => {
  const query = gql`
    query GetUserId {
      users {
        id
        name
      }
    }
  `;

  try {
    const data = await client.request(query);
    return data.users; // Return the array of users
  } catch (error) {
    console.error("Error fetching users:", error.response?.errors || error);
  }
};

export const fetchSubjects = async () => {    
    const query = gql`
      query GetSubjects {
        subjects {
          id
          subject_name
        }
      }
    `;
  
    try {
      const data = await client.request(query);
      return data.subjects;
    } catch (error) {
      console.error("Error fetching subjects:", error.response?.errors || error);
      throw error;
    }
  };

  export const fetchSubjectAndGradeFromQuestionID = async (questionId) => {
    const query = gql`
      query GetSubjectAndGrade($id: uuid!) {
        questions_by_pk(id: $id) {
          subject_id
          grade_id
        }
      }
    `;
  
    try {
      const variables = { id: questionId }; // Pass the questionId as a variable
      const data = await client.request(query, variables);
      return data.questions_by_pk; // Return the subject and grade
    } catch (error) {
      console.error("Error fetching subject and grade:", error.response?.errors || error);
      return null; // Return null in case of an error
    }
  };

  export const fetchGrades = async() => {
    
  const query = gql`
    query_GetGrades {
      grades {
         id
         grade_name   
         }
      }
    `;

    try{
        const data = await client.request(query);
        // console.log(data, "gdata")
        return data.grades;
    } catch (error) {
        console.error("Error fetching grades:", error.response?.errors || error);
        throw error;
     }
  };
  
  export const fetchTopics = async (subjectId, gradeId) => {
    const query = gql`
      query GetTopics($subjectId: uuid!, $gradeId: uuid!) {
        topics(where: {subject_id: {_eq: $subjectId}, grade_id: {_eq: $gradeId}}) {
          id
          topic_name
        }
      }
    `;
  
    try {
      const data = await client.request(query, { subjectId, gradeId });
      return data.topics;
    } catch (error) {
      console.error("Error fetching topics:", error.response?.errors || error);
      throw error;
    }
  };

//Insert History
// export const insertHistory = async (user_id, content, subject, grade, responseData) => {
//   // Ensure that responseData is properly serialized
//   const serializedResponseData = JSON.stringify(responseData); // Convert responseData to JSON string if needed

//   const mutation = gql`
//     mutation InsertHistory($user_id: uuid!, $content: String!, $subject: String!, $grade: Int, $responseData: String!) {
//       insert_history(objects: { 
//         user_id: $user_id, 
//         content: $content, 
//         subject: $subject, 
//         grade: $grade, 
//         date: "now()", 
//         responseData: $responseData 
//       }) {
//         returning {
//           id
//           date
//           content
//           subject
//           grade
//           responseData
//         }
//       }
//     }
//   `;

//   try {
//     const data = await client.request(mutation, { user_id, content, subject, grade, responseData: serializedResponseData });
//     return data.insert_history.returning;
//   } catch (error) {
//     console.error("Error Inserting History", error.response?.errors || error);
//   }
// };


export const updateQuestionDetails = async (id, content) => {
  const mutation = gql`
    mutation UpdateQuestionDetails($id: uuid!, $content: String!) {
      update_questions_by_pk(
        pk_columns: { id: $id }, 
        _set: { content: $content }
      ) {
        id
        content
        updated_at
      }
    }
  `;

  try {
    const data = await client.request(mutation, { id, content});
    return data.update_questions_by_pk;
  } catch (error) {
    console.error("Error updating question details", error.response?.errors || error);
  }
};

export const fetchHistory = async (user_id) => {
  const query = gql`
    query GetQuestions($user_id: uuid!) {
      questions(where: { user_id: { _eq: $user_id } }, order_by: { updated_at: desc }) {
        id
        content
        created_at
        updated_at
        questions 
      }
    }
  `;

  try {
    const data = await client.request(query, { user_id });
    return data.questions; // Return the list of questions for this user
  } catch (error) {
    console.error("Error fetching questions:", error.response?.errors || error);
  }
};

export const fetchSubjectById = async (subjectId) => {
  const query = gql`
    query GetSubjectById($id: uuid!) {
      subjects_by_pk(id: $id) {
        subject_name
      }
    }
  `;

  try {
    const variables = { id: subjectId };
    const data = await client.request(query, variables);
    return data.subjects_by_pk?.subject_name; // Assuming the subject table has a `name` field
  } catch (error) {
    console.error("Error fetching subject:", error.response?.errors || error);
    return null; // Return null in case of an error
  }
};

export const fetchGradeById = async (gradeId) => {
  const query = gql`
    query GetGradeById($id: uuid!) {
      grades_by_pk(id: $id) {
        grade_name
      }
    }
  `;

  try {
    const variables = { id: gradeId };
    const data = await client.request(query, variables);
    return data.grades_by_pk?.grade_name; // Assuming the grade table has a `name` field
  } catch (error) {
    console.error("Error fetching grade:", error.response?.errors || error);
    return null; // Return null in case of an error
  }
};


