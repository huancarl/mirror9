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
import connectToDb from '@/config/db';


function cleanText(text) {
  // Removing lines containing only whitespace
  const cleaned = text.split('\n').filter(line => line.trim().length > 0).join(' ');
  return cleaned.replaceAll('  ', ' ').trim(); // Replace double spaces with single space
}
function cleanSourceDocs(sourceDocs) {
  // Assuming sourceDocs is an array of strings:
  return sourceDocs.map(doc => cleanText(doc));
  // If sourceDocs is an array of objects with a "text" field:
  // return sourceDocs.map(doc => ({ ...doc, text: cleanText(doc.text) }));
}


//Process user query
const userQuery = 'Can you explain the Median Voter Theorem and where I can find it?';


const classMapping = {
  "INFO 2040": "INFO 2040 Textbook",
  "INFO 2950": ['INFO 2950 Koenecke Syllabus', 'INFO 2950 Lecture 7', 'INFO 2950 Handbook',

  'INFO 2950 Fall 2022 Midterm Solutions',
  'INFO 2950 Fall 2022 Midterm Questions',
  'INFO 2950 Lecture 1',
  'INFO 2950 Lecture 2',
  'INFO 2950 Lecture 3',
  'INFO 2950 Lecture 4',
  'INFO 2950 Lecture 5',
  'INFO 2950 Lecture 6',
  'INFO 2950 Lecture 8',
  'INFO 2950 Lecture 9',
  'INFO 2950 Lecture 10',
  'INFO 2950 Midterm Fall 2023 Review Topics'
  ],
  "Other": "Probability Cheatsheet v2.0, Math 21a Review Sheet, Introduction To Probability"
}

function createPrompt(namespaceToSearch: string){
  return `(
   
    You are CornellGPT, an advanced AI developed by two gifted Cornell students.
 
    Your mission is to furnish accurate, detailed, and educational answers by referring to specified educational material only when asked a question that is relevant.
    All questions you receive and all questions the users asks are related to this/these resources: ${classMapping[namespaceToSearch]}. It consists of textbooks,
    lecture slides, syallbi, and other academic resources. Your goal is figuring out the most relevant resource based on the user query.
   
    Here are the refined guidelines for your operation:
 
    ---Available Information: [${classMapping[namespaceToSearch]}].
   
    -----Detailed Instructions**:
    1. Parse the user's query for subject hints or explicit textbook mentions. Select the most relevant textbook/course resource from the
    list: ${classMapping[namespaceToSearch]}.
    2. If multiple textbooks/resources fit, mention all probable ones.
    3. Always follow the response format: "Searching (title/s of the textbook/s)..." Do not deviate from this format.
    4. When faced with an ambiguous query, utilize your training to pick the most relevant educational content in ${classMapping[namespaceToSearch]}. If in doubt,
    list and respond with all potential matches in ${classMapping[namespaceToSearch]}.
    5. Do not give false answers or makeup answers under any circumstances.
    6. Always search within ${classMapping[namespaceToSearch]}. Do not return a resource that is not within ${classMapping[namespaceToSearch]}.
    7. ALWAYS return an response no matter what. If the correct resource to return is unclear just return ${classMapping[namespaceToSearch]}.
    8. When asked about a certain like summarizing a ${classMapping[namespaceToSearch]}, do not forget any details. You must deliver an informative, precise, full and accurate response.

    Query = ${userQuery}
    
  ----Enhanced Example Responses:
 
  - Query: "Can you summarize lecture 7"
    Response: "Searching ${namespaceToSearch} lecture 7..."
 
  - Query: "Tell me about -"
    Response: "Searching ${classMapping[namespaceToSearch]}..."

  - Query: "What lectures talk about SQL"?
    Response: "Searching ${classMapping[namespaceToSearch]}...Here are all the lectures that talk about SQL...."
 
  - Query: "Tell me the grade distribution for this class"
    Response: "Searching ${namespaceToSearch} syllabus..."
 
  - Query: "Summarize chapter 15 of the textbook"
    Response: "Searching ${namespaceToSearch} textbook..."


  - Query: "Summarize the course contents for this class"
    Response: "Searching ${classMapping[namespaceToSearch]}..."
   
  )`
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question, history, userID, sessionID, namespace} = req.body;
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
    const db = await connectToDb();
    const chatHistoryCollection = db.collection("chatHistories");


    const model = new OpenAIChat({
      temperature: 0.1,
      modelName: "gpt-4",
      cache: true,
    });


    const fewShotPrompt = createPrompt(namespace);


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


    console.log('response from chain.call in chat.ts', response.response);


    const extractedNumbs = await extractTitlesFromQuery(response.response);
    // const numbsArray: string[] | undefined = extractedNumbs as string[] | undefined;
   
    // Determine Pinecone namespaces based on extracted years
    const namespaces = extractedNumbs;


    console.log(namespaces, 'namespace in chat.ts');


    //selects the index
    const index = pinecone.Index(PINECONE_INDEX_NAME);


    //init class
    const qaChain = CustomQAChain.fromLLM(model, index, namespaces, {
      returnSourceDocuments: true,
      bufferMaxSize: 4000,
    });


    console.log('searching namespace for results...');


    const results = await qaChain.call({
      question: sanitizedQuestion,
      chat_history: history,
      namespaceToFilter: namespace
    });


    console.log('results', results);


    const message = results.text;
    const sourceDocs = results.sourceDocuments;


    // console.log(sourceDocs, 'this is the chat.ts file');
    const saveToDB = {
      userID,
      sessionID,
      userQuestion: question,
      answer: message,
      sourceDocs,
      timestamp : new Date()
    };


    await chatHistoryCollection.insertOne(saveToDB);


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
