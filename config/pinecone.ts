/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

const PINECONE_INDEX_NAME = 'cornellgpt2';
const PINECONE_NAME_SPACE = 'CornellGPT'; //namespace is optional for your vectors

const NAMESPACE_NUMB: { [key: string]: string } = {
  'Networks': 'Networks',
  'Probability Cheatsheet v2.0': 'Probability Cheatsheet v2.0',
  'Harvard: Math 21a Review Sheet': 'Harvard: Math 21a Review Sheet',
};



export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
