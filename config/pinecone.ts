/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

// const jsonFilePath = path.join('utils', 'pdfNamestoNamespace.json');

const jsonFilePath = path.join('utils', 'pdfNamestoNamespace.json');
const NAMESPACE_NUMB = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8')); 

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;



const PINECONE_NAME_SPACE = "";

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
