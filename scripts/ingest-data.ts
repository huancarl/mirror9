import fs from 'fs';
import path from 'path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

const filePath = 'docs';

type PdfDocument<T = Record<string, any>> = {
  metadata: T;
  pageContent: string;
};

async function loadDocumentsFromFolder(folderPath: string): Promise<PdfDocument[]> {
  const loader = new DirectoryLoader(folderPath, {
    '.pdf': (path) => new PDFLoader(path),
  });
  return loader.load();
}

async function getPDFFilesNames(directory) {
  const files = await fs.promises.readdir(directory);
  return files.filter(file => file.endsWith('.pdf'));
}


async function getPDFFile(directory: string, fileName: string): Promise<PdfDocument[]> {
  const loader = new DirectoryLoader(directory, {
    '.pdf': (path) => new PDFLoader(path),
  });
  // Assuming loadedDocument is an array of Document, and you need the first one
  const firstDocument = loader.load();
  return firstDocument;

}


export const run = async () => {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const pdfFiles = await getPDFFilesNames(`${filePath}/BIOEE_1540`);

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    const classFolders = ['BIOEE_1540',]; // List all class folder names

    for (const pdf of pdfFiles) {
      //const docs = await loadDocumentsFromFolder(`docs/${folder}`);

      const namespace = NAMESPACE_NUMB[pdf][0]; // Adjust this if the mapping of folder to namespace changes

      // for (const doc of docs) {

      const pdfFile = await getPDFFile(filePath,pdf);

      const splitDocs = await textSplitter.splitDocuments(pdfFile);
      console.log(splitDocs);

      const json = JSON.stringify(splitDocs);
      await fs.promises.writeFile(`${namespace}-split.json`, json);

      const upsertChunkSize = 50;
      for (let i = 0; i < splitDocs.length; i += upsertChunkSize) {
        const chunk = splitDocs.slice(i, i + upsertChunkSize);
        await PineconeStore.fromDocuments(chunk, new OpenAIEmbeddings(), {
          pineconeIndex: index,
          namespace: namespace,
          textKey: 'text',
        });
      }
      // }
    }

    console.log('ingestion complete');
  } catch (error) {
    console.error('Failed to ingest your data', error);
  }
};


(async () => {
  await run();
})();