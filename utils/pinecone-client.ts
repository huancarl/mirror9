import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('Pinecone environment or api key vars missing');
}

let pineconeObj: any;
async function initPinecone() {
  try {
    pineconeObj = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY ?? '',
    });

  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}

async function main() {
  await initPinecone();
}

main();

export const pinecone = pineconeObj;
