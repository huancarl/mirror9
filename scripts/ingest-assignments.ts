import path from 'path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { promises as fs } from 'fs';


const filePath = 'docs';

type PdfDocument<T = Record<string, any>> = {
  metadata: T;
  pageContent: string;
};

async function getAllPDFFiles(directory: string): Promise<any> {
  console.log('Loading PDFs from directory:', directory);

  try {
    const files = await fs.readdir(directory);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    const pdfDocuments = await Promise.all(
      pdfFiles.map(async file => {
        const filePath = `${directory}/${file}`;
        const document = await new PDFLoader(filePath).load();
        return [file, document];  // Return the file name along with the document
      })
    );

    return pdfDocuments;
  } catch (error) {
    console.error('Error loading PDF files:', error);
    throw error;
  }
}



export const run = async () => {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 100,
    });

    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    let className = "INFO_1260_Assignments"; //Name of the folder must follow the format: SUBJECT_NUMBER_Assignments

    const pdfFiles = await getAllPDFFiles(`${filePath}/${className}`);
    //const classNamespace = `${className}_All_Materials`;

    for (const [fileNameWithExtension, document] of pdfFiles) {
      
      const namespace = className;
      console.log(document);
      const splitDocs = await textSplitter.splitDocuments(document);

      const upsertChunkSize = 25;
      for (let i = 0; i < splitDocs.length; i += upsertChunkSize) {
        const chunk = splitDocs.slice(i, i + upsertChunkSize);

        //upload to individual namespaces for each class material
        await PineconeStore.fromDocuments(chunk, new OpenAIEmbeddings(), {
          pineconeIndex: index,
          namespace: namespace,
          textKey: 'text',
        });

      }
    }

    const jsonFilePath = path.join('utils', 'classAssignmentsNamespaces.json');
    try {
        const jsonDataString = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(jsonDataString);

        // The key you want to check and update
        const key = className;  // Replace 'yourKey' with the actual key

        // Check if the key exists and update the value
        if (jsonData.hasOwnProperty(key)) {
            jsonData[key] += 1;
        } else {
            jsonData[key] = 1;
        }

        // Write the updated JSON back to the file asynchronously
        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }

    console.log('assignment ingestion complete');

  } catch (error) {
    console.error('Failed to ingest your data', error);
  }
};

(async () => {
  await run();
})();