import path from 'path';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { promises as fs } from 'fs';
import { OpenAIApi, Configuration } from "openai";

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

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,  // Use your OpenAI API key
//  });
// const openai = new OpenAIApi(configuration);

const embeddingsGenerator = new OpenAIEmbeddings();


export const run = async () => {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 100,
    });

    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    const className = "INFO_1260"; //should have underscores for spaces

    const pdfFiles = await getAllPDFFiles(`${filePath}/${className}`);
    const classNamespace = `${className}_All_Materials`;

    for (const [fileNameWithExtension, document] of pdfFiles) {

      const fileName = fileNameWithExtension.replace('.pdf', '');
      
      const namespace = NAMESPACE_NUMB[fileName][0]; // Adjust this if the mapping of folder to namespace changes
      //console.log(document);
      const splitDocs = await textSplitter.splitDocuments(document);

      //console.log(splitDocs);

      //const json = JSON.stringify(splitDocs);
      //await fs.writeFile(`${namespace}-split.json`, json);

      const upsertChunkSize = 25;
      for (let i = 0; i < splitDocs.length; i += upsertChunkSize) {
        const chunk = splitDocs.slice(i, i + upsertChunkSize);

        const embeddings = await Promise.all(chunk.map(doc => 
          embeddingsGenerator.embedDocuments([doc.pageContent])
        ));
 
        // Format for Pinecone upsert
        const pineconeRecords = chunk.map((doc, idx) => {
          // Use either a combination of file name and index or a UUID
          const uniqueId = `${fileNameWithExtension}_${i + idx}`;  // Example: 'document1_0', 'document1_1', etc.
          // Or use UUID: const uniqueId = uuidv4();

          //Create the metadata map using the metadata properties found in documents
          //console.log(chunk[1]);
          let metadataMap = {};
          const text = doc.pageContent;
          const pageNum = doc.metadata.loc.pageNumber;
          const maxPages = doc.metadata.pdf.totalPages;
          const source = doc.metadata.source;
          const fromLine = doc.metadata.loc.lines.from;
          const toLine = doc.metadata.loc.lines.to;

          metadataMap['loc.lines.from'] = fromLine;
          metadataMap['loc.lines.to'] = toLine;
          metadataMap['loc.pageNumber'] = pageNum;
          metadataMap['pdf.totalPages'] = maxPages;
          metadataMap['source'] = source;
          metadataMap['text'] = text;

          return {
            id: uniqueId,
            values: embeddings[idx].flat(),
            metadata: metadataMap,
          };
        });
     
        //console.log(pineconeRecords);
        // Upsert to Pinecone
        //Upsert to the namespace of the specific class material for the class
        await index.namespace(namespace).upsert(pineconeRecords);
        //Upsert to the namespace that contains all of the class materials for each class
        await index.namespace(classNamespace).upsert(pineconeRecords);

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