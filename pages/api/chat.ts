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
const userQuery = 'Can you explain the Median Voter Theorem and where I can find it?';
const availableTextbooks = `Networks, Probability Cheatsheet v2.0, Harvard: Math 21a Review Sheet`;

const fewShotPrompt = `

You are CornellGPT, an AI developed by two Cornell students. You assist by referring to specified educational material. Use the following guidelines:

-- Available Educational Content : [${availableTextbooks}].

**Instructions**:
1. Check user's query for textbook mentions or related subjects.
2. Match subjects to relevant textbooks. Mention all relevant ones.
3. Always respond with: "Searching (title/s of the educational content/s)...".
4. Consider chapter, page number, and section requests as textbook references.
5. Choose the most relevant textbook for ambiguous queries. List all potentials if unsure.
6. Do not fabricate answers.
7. If a question isn't related to ${availableTextbooks}, provide an accurate response without referring to the textbooks. This is very important

----Enhanced Example Responses:
Query = ${userQuery}

- Query: "Can you elucidate on network structures and their importance?" 
  Response: "Searching the Networks textbook..."

- Query: "I'd like to understand counting and thinking conditionally. Give me exact quotations to help my understanding."
  Response: "Searching Probability Cheatsheet v2.0..."

- Query: "Where can I find detailed discussions on vector functions?"
  Response: "Searching Harvard: Math 21a Review Sheet..."

- Query: "Do you have content on Bayesian networks and how it relates to Making Markets?"
  Response: "Searching the Networks textbook..."

- Query: "Help me grasp the nuances of graph algorithms and stochastic processes."
  Response: "Searching Networks and Probability Cheatsheet v2.0..."

- Query: "What is MGF's and Moments and where can I find it?"
  Response: "Searching Probability Cheatsheet v2.0..."

- Query: "What is 1+1?"
  Response: "The answer is 2."

- Query: "Can you please tell me about Albert Einsteins Work?"
  Response: "Albert Einsteins work is centered around...."
`;    

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question, history } = req.body;
  // const question = req.body.question;
  console.log('Received request body:', req.body);
  // console.log(question);

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
      temperature: 0.1,
      modelName: "gpt-3.5-turbo-16k-0613",
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
    const namespaces = extractedNumbs;

    //selects the index
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    //init class
    const qaChain = CustomQAChain.fromLLM(model, index, namespaces, {
      returnSourceDocuments: true, });

    console.log('searching namespace for results...');



    const results = await qaChain.call({
      question: sanitizedQuestion,
      chat_history: history,
    });

    console.log('results', results);

    const message = results.text;
    const sourceDocs = results.sourceDocuments;

    // console.log(sourceDocs, 'this is the chat.ts file');

    const data = {
      message,
      sourceDocs,
    };

    // console.log(data, 'data');

    res.status(200).json(data);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}



