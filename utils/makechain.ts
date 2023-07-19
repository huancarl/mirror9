import { OpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { ConversationalRetrievalQAChain } from 'langchain/chains';

const CONDENSE_PROMPT = `Here is a conversation and a follow-up question. Rephrase the follow-up question to be a standalone question.
Conversation: {chat_history}
Follow-up: {question}
Standalone question:`;

// SUPER IMPORTANT********************************CHANGES EVERYTHING. String to the puppet
const QA_PROMPT = `
As an intelligent AI, engage in a conversation, and provide an answer to 
the question. Your responses should be accurate, detailed, and helpful. You must
determine whether the question is related to the context, somewhat related the context, or not related to the context.
If the question is related to the context, provide a specific answer with extreme accuracy
by the context. If the question is somewhat related to the context, you can provide an answer to the best of your abilities
and answer with or without the context in a accurate,detailed,and helpful manner.
If the question is unrelated to the context completely, your response does not 
have to be related to the context. Remember at all times you will generate an accurate,detailed,and helpful
message regardless of the question that poses you.

Context: {context}
Question: {question}
Response:`;

export const makeChain = (vectorstore: PineconeStore) => {

  // Create multiple models with different parameters
  const models = [
    new OpenAI({
      temperature: 0.1, 
      modelName: 'gpt-3.5-turbo',
    }),
    // Add more models with different parameters here if you want to create an ensemble
  ];

  // Create multiple chains for each model
  const chains = models.map((model) =>
    ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorstore.asRetriever(),
      {
        qaTemplate: QA_PROMPT,
        questionGeneratorTemplate: CONDENSE_PROMPT,
        returnSourceDocuments: true,
      },
    )
  );

  // Implement logic to use your ensemble of chains. Here we return the first one for simplicity.
  return chains[0];
};