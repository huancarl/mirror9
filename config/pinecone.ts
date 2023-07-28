/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

const PINECONE_INDEX_NAME = 'cornellgpt2';
const PINECONE_NAME_SPACE = 'CornellGPT'; //namespace is optional for your vectors

const NAMESPACE_NUMB: { [key: number]: string } = {
  1: 'book-1',
  2: 'book-2',
  3: 'book-3',
};



export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
