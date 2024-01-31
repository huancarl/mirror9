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
    
    const className = "CS_4780";

    const pdfFiles = await getAllPDFFiles(`${filePath}/${className}`);
    const classNamespace = `${className}_All_Materials`;

    for (const [fileNameWithExtension, document] of pdfFiles) {

      const fileName = fileNameWithExtension.replace('.pdf', '');
      
      const namespace = NAMESPACE_NUMB[fileName][0]; // Adjust this if the mapping of folder to namespace changes

      const splitDocs = await textSplitter.splitDocuments(document);

      //const json = JSON.stringify(splitDocs);
      //await fs.writeFile(`${namespace}-split.json`, json);

      const upsertChunkSize = 25;
      for (let i = 0; i < splitDocs.length; i += upsertChunkSize) {
        const chunk = splitDocs.slice(i, i + upsertChunkSize);

        //upload to individual namespaces for each class material
        await PineconeStore.fromDocuments(chunk, new OpenAIEmbeddings(), {
          pineconeIndex: index,
          namespace: namespace,
          textKey: 'text',
        });

        //upload to namespace with all materials
        await PineconeStore.fromDocuments(chunk, new OpenAIEmbeddings(), {
          pineconeIndex: index,
          namespace: classNamespace,
          textKey: 'text',
        });

      }
    }
    console.log('ingestion complete');
  } catch (error) {
    console.error('Failed to ingest your data', error);
  }
};

(async () => {
  await run();
})();