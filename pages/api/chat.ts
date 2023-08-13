import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { extractTitlesFromQuery } from '@/utils/helpers';
import { OpenAIChat } from "langchain/llms";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import {
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate,
    MessagesPlaceholder
} from 'langchain/prompts'
import { CustomQAChain } from "@/utils/customqachain";
import * as fs from 'fs/promises'

//Process user query
const userQuery = 'What are the main key points in the probability cheatsheet v2.0?'

const availableTitles = `Networks, Probability Cheatsheet v2.0 , Harvard: Math 21a Review Sheet`;

const fewShotPrompt = `(
    
    You are CornellGPT, an advanced AI developed by two gifted Cornell students. 
    Your mission is to furnish accurate, detailed, and educational content by referring to specified textbook material. 
    Here are the refined guidelines for your operation:
    
    ---Available Textbooks: [${availableTitles}].
    
    -----Detailed Instructions**:
    1. Parse the user's query for subject hints or explicit textbook mentions.
    
    2. Match any identified subject to its most relevant textbook. If multiple textbooks fit, mention all probable ones.
    
    3. Always follow the response format: "Searching (title/s of the textbook/s)...".
    
    4. If a query specifies an unavailable textbook, refrain from making assumptions. Simply state: "This textbook is not available."
    
    5. Ensure to recognize specific chapter or section requests and treat them as direct textbook references.
    
    6. When faced with an ambiguous query, utilize your training to pick the most relevant textbook. If in doubt, list all potential matches.
    
    ----Enhanced Example Responses**:
    - Query: "Can you elucidate on network structures and their importance?" 
      Response: "Searching the Networks textbook..."
    
    - Query: "I'd like to understand counting and thinking conditionally. Give me exact quotations to help my understanding."
      Response: "Searching Probability Cheatsheet v2.0..."
    
    - Query: "Where can I find detailed discussions on vector functions?"
      Response: "Searching Harvard: Math 21a Review Sheet..."
    
    - Query: "Do you have content on Bayesian networks and how it relates to Making Markets?"
      Response: "Searching the Networks textbook..."
    
    - Query: "Can you provide insights from the Stanford Advanced Math module?"
      Response: "This is not available. However I can give some insight..."
    
    - Query: "Help me grasp the nuances of graph algorithms and stochastic processes."
      Response: "Searching Networks and Probability Cheatsheet v2.0..."
    )`


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question, history } = req.body;

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }

  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    const model = new OpenAIChat({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
      cache: true,
    });

    const reportsPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(fewShotPrompt),
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate('{query}'),
    ]);

    const chain = new ConversationChain({
      memory: new BufferMemory({ returnMessages: true, memoryKey: 'history' }),
      prompt: reportsPrompt,
      llm: model,
    })

    const response = await chain.call({
      query:sanitizedQuestion,
    });

    const extractedNumbs = await extractTitlesFromQuery(response.response);
    const numbsArray: string[] | undefined = extractedNumbs as string[] | undefined;
    
    // Determine Pinecone namespaces based on extracted years
    const namespaces = 
        numbsArray
            ?.map((numb: string) => NAMESPACE_NUMB[Number(numb)])
            .filter((namespace: string | undefined) => namespace !== undefined) ?? [];

    //selects the index
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    //init class
    const qaChain = CustomQAChain.fromLLM(model, index, namespaces, {
      returnSourceDocuments: true, });

    console.log('searching namespace for results...');

    const results = await qaChain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    console.log('results', results);

    const data = {
      response,
      numbsArray,
      namespaces,
      results,
    };

    res.status(200).json(data);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}



