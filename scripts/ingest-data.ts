import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { text } from 'stream/consumers';

/* Name of directory to retrieve your files from 
   Make sure to add your PDF files inside the 'docs' folder
*/
const filePath = 'docs';

export const run = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFDistLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const docs = await directoryLoader.load();

    //Group documents by title
    const groupedDocs = groupDocumentsByTitle(docs);

    //console.log(rawDocs, rawDocs.length);
    const json = JSON.stringify(Array.from(groupedDocs.entries()));

    await fs.writeFile('test.json', json);

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    // Iterate through the grouped pdfs
    for (const [title, documents] of groupedDocs.entries()) {
      //Set namespace based on title
      const namespace = '(title';

      console.log('namespaceCount', namespace);

      //Split documents into chunks
      const splitDocs = await textSplitter.splitDocuments(documents);
      console.log('splitDocs', splitDocs.length);

      const json = JSON.stringify(splitDocs);

      await fs.writeFile('(title)-split.json', json);


      const upsertChunkSize = 50;
      console.log('ingesting...may take a few minutes');
      for (let i = 0; i < splitDocs.length; i += upsertChunkSize){
        const chunk = splitDocs.slice(i, i + upsertChunkSize);
        console.log('chunk', i, chunk);
        await PineconeStore.fromDocuments (
          index,
          chunk,
          new OpenAIEmbeddings(),
          'text',
          namespace
        );
      }
    }
  } catch(error) {
    console.log('error', error);
    throw new Error ('Failed to ingest your data cuh');
  }
}

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //embed the PDF documents
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();

