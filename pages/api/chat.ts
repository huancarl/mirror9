import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { extractTitlesFromQuery } from '@/utils/helpers';
import { OpenAIChat } from "langchain/llms/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import {
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate,
    MessagesPlaceholder
} from 'langchain/prompts'
import { CustomQAChain } from "@/utils/customqachain";
import { AssignmentCustomQAChain } from '@/utils/assignmentsqachain';
import * as fs from 'fs/promises'
import {connectToDb} from '@/config/db';
import { CoursesCustomQAChain } from '@/utils/coursesCustomqachain';
import {anti_cheat} from '@/utils/antiCheat';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// import { HfInference } from '@huggingface/inference';

export const maxDuration = 100; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';
 
export function GET(request: Request) {
  return new Response('Vercel', {
    status: 200,
  });
}


// function cleanText(text) {
//   // Removing lines containing only whitespace
//   const cleaned = text.split('\n').filter(line => line.trim().length > 0).join(' ');
//   return cleaned.replaceAll('  ', ' ').trim(); // Replace double spaces with single space
// }
// function cleanSourceDocs(sourceDocs) {
//   // Assuming sourceDocs is an array of strings:
//   return sourceDocs.map(doc => cleanText(doc));
//   // If sourceDocs is an array of objects with a "text" field:
//   // return sourceDocs.map(doc => ({ ...doc, text: cleanText(doc.text) }));
// }

interface Metadata {
  text: string;
  source: string;
  pageNumber: number;
  totalPages: number;
  chapter?: number;   // Optional, if not all documents have chapters
  book?: string;      // Optional, if not all documents are from books
}
interface PineconeResultItem {
  metadata: Metadata;
  values: any;
  text: any;
  value: {
      text: string;
      source: string;
      pageNumber: number;
      totalPages: number;
      chapter?: number;
      book?: string;
      score : any;
  };
}

async function chatWithOpenAI(messages) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY; 

  const postData = {
      model: "gpt-4-0125-preview",
      messages: messages,
  };

  const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(postData),
  });

  const data = await response.json();
  return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  const { question, messages, userID, sessionID, namespace, messageID} = req.body;
  const image = req.body.image;

  const cleanedNamespace = namespace.replace(/ /g, '_');

  //Get the list of class materials from chatAccessDocuments to put to prompt so gpt can choose the best one to search

  const path = require('path');
  const classMappingFilePath = path.join(process.cwd(), 'utils', 'chatAccessDocuments.json');
  // const classMappingFilePath = path.join('utils', 'chatAccessDocuments.json');
  const data = await fs.readFile(classMappingFilePath, 'utf8');
  const classMapping = JSON.parse(data);

  function createPrompt(namespaceToSearch: string){

    return `(
      Your mission is to determine when and what to search based on the user query of the class.
      Available Search Documents = ${classMapping[namespaceToSearch]} 
      Context of the class = ${namespaceToSearch}
      - Always respond like: "Searching ..." Never deviate from this format.
      - When searching never change the name of the available search documents. It must be strictly word by word how its given to you.
        Do not shorten it even if there is repetition like: "HD_3620_HD_3620_Spring_2024_syllabus".Y ou must search the document with the exact name do not modify it.
      - You must recognize hints, keywords, explicit mentions, or any relation or clue to source documents
        and then search strictly and accordingly from the available search documents for specific documents.
      - Use your intelligence to determine what to search and what each document may entail, 
        for example anything about instructors, professors, course breakdown, etc would probably be a syllabus search.
        for example lec01 in the search documents most likely means lecture 1. Keep these in mind as you search.
      - If multiple search documents are relevant and needed, search accordingly.
      - If the query asks for class material that does not strictly exist in the search documents, then search nothing denoted by 
      empty space.
      - If the query says Hi or other simple conversational messages, then search nothing.
      - If the query asks something general unrelated to the academic context of ${namespaceToSearch} like "What is 2+2", then search nothing.
      - If you are searching another material then you must always also search the All Materials document. Unless you are searching nothing,
      always search the All Materials document in addition to whatever else you are searching.
      - If you are uncertain with the query, then search only All Materials document.
    )`
  };


  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }


  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.replace(/^\s+|\s+$/g, '').replace(/\n/g, ' ');


  try {
    const db = await connectToDb();
    const userLimitCollection = db.collection('verifiedUsers');

    //Get the current user and update their messagesLeft field. Detect if exceeded
    const currUser = await userLimitCollection.findOne({userEmail: userID});
    if (currUser) {
      if(currUser.paid === false){
        if(currUser.messagesLeft <= 0){
          const limitMessage = {
            message: 'User has exceeded their limit for messages',
            sourceDocs: null,
          };
          return res.status(200).json(limitMessage);
        }
        else{
          await userLimitCollection.updateOne(
            { userEmail: userID }, 
            { $inc: { messagesLeft: 0 } }); // Change THIS WHEN GOING BACK TO PAYWALL/TRAACK+
        }
      }
    } 
    const chatHistoryCollection = db.collection("chatHistories");
    const chatSessionCollection = db.collection('sessionIDs');
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    
  //Course Catalog
  //   if(cleanedNamespace === 'Course_Finder_SP24'){
  //     const modelForResponse = new OpenAIChat({
  //       temperature: 0.1,
  //       modelName: "gpt-3.5-turbo-0125",
  //       cache: true,
  //     });

  //     //init class
  //     const qaChain = CoursesCustomQAChain.fromLLM(modelForResponse, index, ['Course_Catalog'], {
  //       returnSourceDocuments: true,
  //       bufferMaxSize: 4000,
  //     });

  //     const results = await qaChain.call({
  //       question: sanitizedQuestion,
  //       chat_history: messages,
  //       namespaceToFilter: cleanedNamespace
  //     });
      
  //     const message = results.text;
  //     const sourceDocs = null;

  //     //save message to the database before displaying it
  //     const saveToDB = {
  //       userID,
  //       sessionID,
  //       userQuestion: question,
  //       answer: message,
  //       sourceDocs,
  //       timestamp : new Date()
  //     };
  //     await chatHistoryCollection.insertOne(saveToDB);
  //     const currSession = await chatSessionCollection.findOne({sessionID, userID });

  //     if (currSession && currSession.isEmpty === true){
  //       //update the document's .isEmpty field in mongodb
  //       await chatSessionCollection.updateOne({ sessionID }, { $set: { isEmpty: false } });
  //     }

  //     //check the date of the access
  //     const getSessionName = () => {
  //       const now = new Date();
  //       return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  //     };
      
  //     // Check the date of the access
  //     if (currSession) {
  //       const sessionDate = new Date(currSession.date);
  //       const currentDate = new Date();
      
  //       // Compare only the year, month, and day (ignoring the time)
  //       if(sessionDate.getUTCFullYear() !== currentDate.getUTCFullYear() ||
  //         sessionDate.getUTCMonth() !== currentDate.getUTCMonth() ||
  //         sessionDate.getUTCDate() !== currentDate.getUTCDate()) {
  //         // Update the last access field of the session if chatted on a different day from its date field
  //         const newName = getSessionName();
  //         await chatSessionCollection.updateOne(
  //           { sessionID, userID },
  //           {
  //             $set: {
  //               name: newName,
  //               date: currentDate
  //             }
  //           }
  //         );
  //       }
  //     }
    
  //     const data = {
  //       message,
  //       sourceDocs,
  //     };
  //     res.status(200).json(data);
  //     return;
  // }


  const cleanedChatHistory: string [] = []
  //Cleaned the message history
  for (const mess of messages){
    const cleanedMessage = mess.message.replace(/"[^"]*"/g, '');
    cleanedChatHistory.push(cleanedMessage);
  }

  const previousMessages: object [] = [];
  if(cleanedChatHistory) {
    for(let i = 0; i < cleanedChatHistory.length; i++){
      if(i%2 === 0){
        // If even then user's question
        previousMessages.push({role: "user", content: `${cleanedChatHistory[i]}`})
      }
      else{
        // If odd then AI answer
        previousMessages.push({role: "assistant", content: `${cleanedChatHistory[i]}`})
        }
      }
  }

  console.log(namespace, 'this is namespace');

  let namespaceForPrompt = namespace.replace(/ /g, '_');

  const prompt = createPrompt(namespaceForPrompt);

  console.log(namespaceForPrompt);

  previousMessages.push(
    { role: "system", content: prompt },
    { role: "user", content: question },
  );

  let response = await chatWithOpenAI(previousMessages);
  response = response.choices[0].message.content;

    // const processedMessages = messages.map((messageObject: { message: any; }) => messageObject.message);

    // const fewShotPrompt = createPrompt(cleanedNamespace, messages);

    // const reportsPrompt = ChatPromptTemplate.fromPromptMessages([
    //   SystemMessagePromptTemplate.fromTemplate(fewShotPrompt),
    //   new MessagesPlaceholder('chat_history'),
    //   HumanMessagePromptTemplate.fromTemplate('{query}'),
    // ]);
    // const chain = new ConversationChain({
    //   memory: new BufferMemory({ returnMessages: true, memoryKey: 'chat_history' }),
    //   prompt: reportsPrompt,
    //   llm: model,
    // })
    // const response = await chain.call({
    //   query:sanitizedQuestion,
    // });


    console.log('response from chat.ts', response);


    const extractedNumbs = await extractTitlesFromQuery(response);
    // const numbsArray: string[] | undefined = extractedNumbs as string[] | undefined;
   

    const namespaces = extractedNumbs;            


    console.log(namespaces, 'namespace in chat.ts');

    //Not used delete please
    const modelForResponse = new OpenAIChat({
      temperature: 0.1,
      // modelName: "gpt-4-0125-preview",
      // modelName: "gpt-3.5-turbo-0125",
      cache: true,
    });
    
    //gpt-4-1106-preview

    //init classes for responses

    const qaChain = CustomQAChain.fromLLM(modelForResponse, index, namespaces,{
      returnSourceDocuments: true,
      bufferMaxSize: 4000,
    }, userID, messageID);
    
    // const assignmentQaChain = AssignmentCustomQAChain.fromLLM(modelForResponse, index, namespaces,{
    //   returnSourceDocuments: true,
    //   bufferMaxSize: 4000,
    // }, userID, messageID);

    
  
    //This creates an openAI embedding of the question to search the pinecone for vectors
    const embeddings = new OpenAIEmbeddings();
    const queryEmbedding = await embeddings.embedQuery(question);

    //Check the list of all ingested class assignments for the anti cheat check.
    const cheatJsonMapping = path.join(process.cwd(), 'utils', 'classAssignmentsNamespaces.json');
    const cheatData = await fs.readFile(cheatJsonMapping, 'utf8');
    const cheatNamespaces = JSON.parse(cheatData);

    let namespaceWithUnderscore = namespace.replace(/ /g, '_');
    let assignmentNamespace = namespaceWithUnderscore + '_Assignments';
    let allMaterialsNamespace = namespaceWithUnderscore + '_All_Materials';

    // Sourcedocs retrieved from the backend
    let results: any;
    let customClassPromptAddon = '';

    //Only run if the class has a class assignments namespace
    if(assignmentNamespace in cheatNamespaces){

      //Check if the user's question is a direct copy and paste of a current assignment's questions
      const antiCheatResponse = await anti_cheat(question, queryEmbedding, assignmentNamespace, allMaterialsNamespace);
      //'cheatGuess' is a bool of true or false and 'vector' is what the system thinks the assignment the user is trying finesse
      const cheating = antiCheatResponse['cheatGuess'];
      const metadata = antiCheatResponse['vector'];

      if(cheating) {
            //If anti cheat returns true then the user is suspected of cheating
            //Parameters for anti_cheat function: question, question embeddings, namespace to search
            console.log('Cheating detected, avert from normal user flow');

            const antiCheatPromptsPath = path.join(process.cwd(), 'utils', 'classAntiCheatPrompts.json');
            const promptsData = await fs.readFile(antiCheatPromptsPath, 'utf8');
            const antiCheatPrompts = JSON.parse(promptsData);
            customClassPromptAddon += antiCheatPrompts[namespaceWithUnderscore];

            // results = await assignmentQaChain.call({
            //   question: question,
            //   questionEmbed: queryEmbedding,
            //   chat_history: messages,
            //   namespaceToFilter: cleanedNamespace,
            //   metadata: metadata
            // });
      }
    }

    results = await qaChain.call({
      question: question,
      questionEmbed: queryEmbedding,
      chat_history: messages,
      namespaceToFilter: cleanedNamespace,
      promptAddOn: customClassPromptAddon,
    });

    const message = results.text;
    const sourceDocs = results.sourceDocuments;

    //save message to the database
    const saveToDB = {
      userID,
      sessionID,
      userQuestion: question,
      answer: message,
      sourceDocs,
      timestamp : new Date()
    };

    await chatHistoryCollection.insertOne(saveToDB);
    const currSession = await chatSessionCollection.findOne({sessionID, userID });

    if (currSession && currSession.isEmpty === true){
      //update the document's .isEmpty field in mongodb
      await chatSessionCollection.updateOne({ sessionID }, { $set: { isEmpty: false } });
    }

    //check the date of the access
    const getSessionName = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Check the date of the access
    if (currSession) {
      const sessionDate = new Date(currSession.date);
      const currentDate = new Date();
    
      // Compare only the year, month, and day (ignoring the time)
      if(sessionDate.getUTCFullYear() !== currentDate.getUTCFullYear() ||
         sessionDate.getUTCMonth() !== currentDate.getUTCMonth() ||
         sessionDate.getUTCDate() !== currentDate.getUTCDate()) {
        // Update the last access field of the session if chatted on a different day from its date field
        const newName = getSessionName();
        await chatSessionCollection.updateOne(
          { sessionID, userID },
          {
            $set: {
              name: newName,
              date: currentDate
            }
          }
        );
      }
    }
    
    const data = {
      sourceDocs,
    };
    // console.log(data, 'data');
    res.status(200).json(data);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}