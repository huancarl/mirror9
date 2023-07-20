import { OpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { ConversationalRetrievalQAChain } from 'langchain/chains';

const CONDENSE_PROMPT = `Given a conversation and a follow-up question, 
your task is to rephrase the follow-up question into a standalone question 
that retains all its original meaning and context. Ensure the new question is accurate, specific, and can be understood 
without any additional context.

Conversation: {chat_history}
Follow-up: {question}
Standalone question:`;


// SUPER IMPORTANT********************************CHANGES EVERYTHING. String to the puppet
const QA_PROMPT = `
As an AI, engage in an educational conversation and provide accurate, detailed, and helpful answers to the questions asked.

Even when a question asks for information not directly provided in the immediate context, such as details 
about a specific chapter, use your training to provide an accurate and detailed answer where possible. 
When someone asks about a specific chapter, they expect a detailed and explanatory response that pertains 
to that particular chapter. Remember you have access to all context, you just need to identify it.

Be consistent with your responses. If asked the same exact question twice, provide a consistent but better response.

Always consider the relevance of the context for each individual question:
- If a question's context is distinct from a previous one, switch context accordingly and do not carry over irrelevant information from the previous context. 
- If the context of a question is a continuation or related to the previous context, then use the information appropriately to provide a detailed and specific response.

Based on the relationship between the question and the context:

- If the question is related to the context, answer precisely using the context.
- If the question is somewhat related, provide an answer to the best of your abilities, considering the context where appropriate.
- If the question is unrelated to the context, answer the question accurately even if the context does not provide relevant information.

When the context is ambiguous, assume the most probable context for the question.

Ensure your answers are always attentive to the specifics of the question, accurate, detailed, and helpful.

Context: {context}
Question: {question}
Response:
`;

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
