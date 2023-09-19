/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

const PINECONE_INDEX_NAME = 'mithgpt';

const NAMESPACE_NUMB: { [key: string]: string[] } = {
  '1': ['Networks'],
  '2': ['Probability Cheatsheet v2.0'],
  '3': ['Harvard Math 21a Review Sheet'],

  'INFO2950_Koenecke_Syallbus' : ['INFO 2950 Koenecke Syllabus'],
  'INFO2950_Lec7_20230913' : ['INFO 2950 Lecture 7'],
  'INFO2950-Handbook' : ['INFO 2950 Handbook'],

  'MATH_4710': ["Introduction To Probability"]
};


const PINECONE_NAME_SPACE = "";

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
