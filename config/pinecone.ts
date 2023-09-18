/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

const PINECONE_INDEX_NAME = 'cornellgpt';

const NAMESPACE_NUMB: { [key: string]: string } = {
  '1': 'Networks',
  '2': 'Probability Cheatsheet v2.0',
  '3': 'Harvard Math 21a Review Sheet',
  'INFO_2950': 'INFO 2950 Syllabus',
  'MATH_4710': "Introduction To Probability"
};


const PINECONE_NAME_SPACE = "";

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
