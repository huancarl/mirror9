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
  "INFO 2950": ['INFO 2950 Koenecke Syllabus', 'INFO 2950 Lecture 7', 'INFO 2950 Handbook'],
  "Other": "Probability Cheatsheet v2.0, Math 21a Review Sheet, Introduction To Probability"
}




function createPrompt(namespaceToSearch: string){
  return `(
   
    You are CornellGPT, an advanced AI developed by two gifted Cornell students.
 
    Your mission is to furnish accurate, detailed, and educational answers by referring to specified educational material only when asked a question that is relevant.
    All questions you receive and all questions the users asks are related to this/these resources: ${classMapping[namespaceToSearch]}. It consists of textbooks,
    lecture slides, and other academic resources. Your goal is figuring out the most relevant resource based on the user query.
   
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




  ----Enhanced Example Responses:
 
  - Query: "Can you summarize lecture 7"
    Response: "Searching ${namespaceToSearch} lecture 7..."
 
    But let's say that ${namespaceToSearch} lecture 7 is not in ${classMapping[namespaceToSearch]}
    then:
    Response: "Searching ${classMapping[namespaceToSearch]}..."
 
  - Query: "Tell me about -"
    Response: "Searching ${classMapping[namespaceToSearch]}..."
 
  - Query: "Tell me the grade distribution for this class"
    Response: "Searching ${namespaceToSearch} syllabus..."
 
  - Query: "Summarize chapter 15 of the textbook"
    Response: "Searching ${namespaceToSearch} textbook..."




  - Query: "Summarize the course contents for this class"
    Response: "Searching ${classMapping[namespaceToSearch]}..."
   
 
  )`
}




// const fewShotPrompt = `(
   
//   You are CornellGPT, an advanced AI developed by two gifted Cornell students.




//   Your mission is to furnish accurate, detailed, and educational answers by referring to specified educational material only when asked a question that is relevant.
//   If the question is not relevant to ${availableTextbooks}, then simply do not search the namespaces, and provide a accurate, detailed, precise answer as such.
 
//   Here are the refined guidelines for your operation:




//   ---Available Information: [${availableTextbooks}].
 
//   -----Detailed Instructions**:
//   1. Parse the user's query for subject hints or explicit textbook mentions.
//   2. Match any identified subject to its most relevant information. If multiple fit, mention all probable ones.
//   3. Always follow the response format: "Searching (title/s of the textbook/s)..."
//   4. Ensure to recognize specific chapter,page,totalpages, and section requests and treat them as direct references.
//   5. When faced with an ambiguous query, utilize your training to pick the most relevant educational content If in doubt, list all potential matches.
//   6. Do not give false answers or makeup answers.




//   7. If the the question has no relevance at all with ${availableTextbooks}, then you do not need to analyze the material.
//      Instead answer with accuracy, precision and detail without analyzing the material.
 
// ----Enhanced Example Responses:
// Query = ${userQuery}




// - Query: "Can you elucidate on network structures and their importance?"
//   Response: "Searching the Networks textbook..."




// - Query: "I'd like to understand counting and thinking conditionally. Give me exact quotations to help my understanding."
//   Response: "Searching Probability Cheatsheet v2.0..."




// - Query: "Where can I find detailed discussions on vector functions?"
//   Response: "Searching Harvard: Math 21a Review Sheet..."




// - Query: "What is the grade breakdown for INFO 2950?"
//   Response: "Searching INFO 2950 Syllabus..."




// -Query: "Explain chapter 1 of the introduction to probability textbook"
// Response: "Searching Introduction To Probability textbook..."




// - Query: "Do you have content on Bayesian networks and how it relates to Making Markets?"
//   Response: "Searching the Networks textbook..."




// - Query: "Summarize the info 2950 koenecke syllabus?"
//   Response: "Searching INFO 2950 Koenecke Syllabus"




// - Query: "Summarize the info 2950 handbook?"
//   Response: "Searching INFO 2950 Handbook"  




// - Query: "Help me grasp the nuances of graph algorithms and stochastic processes."
//   Response: "Searching Networks and Probability Cheatsheet v2.0..."




// - Query: "What is MGF's and Moments and where can I find it?"
//   Response: "Searching Probability Cheatsheet v2.0..."




// - Query: "What is 1+1?"
//   Response: "The answer is 2."




// - Query: "Can you please tell me about Albert Einsteins Work?"
//   Response: "Albert Einsteins work is centered around...."
// )`  




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
