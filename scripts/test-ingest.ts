import fs from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { NAMESPACE_YEARS, PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { text } from 'stream/consumers';

const filePath = 'docs';

export const run = async () => {
  try {

    // Load raw docs from the pdf files
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFDistLoader(path),
    });

    //const loader = new PDFDistLoader(filePath);

    const docs = await directoryLoader.load();

    // ** Need to Fix  ---
    const groupedDocs = groupDocumentsByYear(docs);

    // console.log(rawDocs, rawDocs.length)
    const json = JSON.stringify(Array.from(groupedDocs.entries()));

    await fs.promises.writeFile('test.json', json); //slightly different

    //Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //Iterate through grouped pdfs
    for (const [year, documents] of groupedDocs.entries()) {
      const namespace = 'tesla-${year}';

      console.log('namespaceCount', namespace);

      //Split docs into chunks
      const splitDocs = await textSplitter.splitDocuments(documents);
      console.log('splitDocs', splitDocs.length);

      const json = JSON.stringify(splitDocs);
      await fs.promises.writeFile(`${year}-split.json`, json);

      //Pinecone recommends a limit of 100 vectors per upsert request
      const upsertChunkSize = 50;
      console.log('ingesting....may take a few minutes!')
      for (let i = 0; i < splitDocs.length; i += upsertChunkSize) {
        const chunk = splitDocs.slice(i, i + upsertChunkSize);
        console.log('chunk', i, chunk);
        await PineconeStore.fromDocuments(
          index,
          chunk,
          new OpenAIEmbeddings(),
          'text',
          namespace,
        );
      }
    }
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest! Try again or change your code/format')
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();


// 1. Load documents using 'directionaryLoader'
// 2. Group documents by year using the 'groupDocumentsByYear' function
// 3. Iterate through the grouped documents by year using the for-of loop
// 4. For each group of documents belonging to the same year. split them into chunks using the 'textSplitter.splitDocuments
// 5. Upsert the split documents to Pinecone using seperate namespaces for each year.

function groupDocumentsByYear(docs: Document[]): Map <number, Document[]> {
    const groupedDocs = new Map<number, Document[]>();
    for (const doc of docs){
        const year = doc.metadata.year;
        //get array of documents for the current year
        const yearDocs = groupedDocs.get(year) ?? [];

        //..........complete the code
    }
}