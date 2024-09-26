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
      console.log(data, "sdata");
      return data.subjects;
    } catch (error) {
      console.error("Error fetching subjects:", error.response?.errors || error);
      throw error;
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
        console.log(data, "gdata")
        return data.grades;
    } catch (error) {
        console.error("Error fetching grades:", error.response?.errors || error);
        throw error;
     }
  };
  
