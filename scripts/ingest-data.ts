import fs from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { text } from 'stream/consumers';

const filePath = 'docs';

export const run = async () => {
  try {
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFLoader(path),
    });

    const docs = await directoryLoader.load();

    // Please provide your own function to group the documents by title
    const groupedDocs = groupDocumentsByTitle(docs);

    const json = JSON.stringify(Array.from(groupedDocs.entries()));
    await fs.promises.writeFile('test.json', json);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    for (const [title, documents] of groupedDocs.entries()) {
      const namespace = title;

      const splitDocs = await textSplitter.splitDocuments(documents);

      const json = JSON.stringify(splitDocs);
      await fs.promises.writeFile(`${title}-split.json`, json);

      const upsertChunkSize = 50;
      for (let i = 0; i < splitDocs.length; i += upsertChunkSize) {
        const chunk = splitDocs.slice(i, i + upsertChunkSize);
        await PineconeStore.fromDocuments (
          index,
          chunk,
          new OpenAIEmbeddings(),
          'text',
          PINECONE_NAME_SPACE,
        );
      }
    }

    console.log('creating vector store...');
    const embeddings = new OpenAIEmbeddings();
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.error('Failed to ingest your data', error);
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();


