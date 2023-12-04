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
import { CoursesCustomQAChain } from '@/utils/coursesCustomqachain';


function cleanText(text) {
  // Removing lines containing only whitespace
  const cleaned = text.split('\n').filter(line => line.trim().length > 0).join(' ');
  return cleaned.replaceAll('  ', ' ').trim(); // Replace double spaces with single space
}
// function cleanSourceDocs(sourceDocs) {
//   // Assuming sourceDocs is an array of strings:
//   return sourceDocs.map(doc => cleanText(doc));
//   // If sourceDocs is an array of objects with a "text" field:
//   // return sourceDocs.map(doc => ({ ...doc, text: cleanText(doc.text) }));
// }


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  const { question, messages, userID, sessionID, namespace} = req.body;
  const image = req.body.image;

   const classMapping = {
    "INFO 2040": ["INFO 2040 Textbook"],
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
    "Other": "Probability Cheatsheet v2.0, Math 21a Review Sheet, Introduction To Probability",
    "BIOEE 1540": [
      "BIOEE Lecture 1 Course Logistics Fall 2023",
      "BIOEE Lecture 2 Overview",
      "BIOEE Lecture 3 Origin of Earth Ocean",
      "BIOEE Lecture 4 History of Life in the Oceans 2023",
      "BIOEE Lecture 5 6 Marine Geology",
      "BIOEE Lecture 7 8 9 Waves Tides",
      "BIOEE Lecture 10 11 12 Ocean Circulation",
      "BIOEE Lecture 13 El Nino Other Oscillations",
      "BIOEE Lecture 15 16 Primary Production",
      "BIOEE Lecture 17 Pelagic FoodWebs",
      "BIOEE Lecture 18 Guest Lecture 2023 COMPLETE",
      "BIOEE Lecture 19 Microbial Processes",
      "BIOEE Lecture 20 21 Rocky Intertidal Coral Reefs Whales",
      "BIOEE Lecture 22 23 Marine Chemistry",
      "BIOEE Lecture 25 26 Climate Change Science I and II",
      "BIOEE Lecture 27 Howarth methane Oct 30 2023",
      "BIOEE Lecture 28 Climate Change and Extreme Weather",
      "BIOEE Lecture 30 Howarth Climate Solutions Nov 6 2023",
      "BIOEE Lecture 31 Cornell 2035 Climate Action Plan",
      "BIOEE Lecture 32 Marine Pollution",
      "BIOEE Lecture 33 Fishing Impacts",
      "BIOEE Lecture 34 Loss of Global Biodiversity",
      "BIOEE Lecture 35 6th Extinction in the Oceans 2023"
  ]

  }

  function createPrompt(namespaceToSearch: string, chat_history: any){
    return `(
     
      Your mission is to determine when and what to search based on the user query of the class.
      Queries you receive will usually be related to ${namespaceToSearch} and ${classMapping[namespaceToSearch]}, but not always.
      
      Available Search Documents = ${classMapping[namespaceToSearch]}
      Context of the class = ${namespaceToSearch}
      Chat History (conversation): ${chat_history}
  
      - Always respond like: "Searching(' ')..." or "Searching ..." Never deviate from this format.
  
      - Utilize the user's query for hints, explicit mentions, or any relation to source documents, search strictly and accordingly from the available search documents. 
      - Be attentive, selective, and cautious about what to select. Do not select the wrong things. You must select the right things.
  
      - If the query relates to certain search documents, make sure to make the right selection.

      - If you are uncertain with the query or faced with an ambiguous query, then search everything available and choose which one it might be carefully and with accuracy.
  
      - If multiple search documents are relevant and needed, then search accordingly. 

      - Be aware of ${chat_history} as you search. If the current query is a continuation of the last, then search accordingly, and vice versa.
  
      - Should a question context be a continuation or associated with the prior one found in history, use history proficiently to search consistently.
        If a question context is distinctive from the history, search adeptly. 

  
  
    Example Responses:
   
    - Query: "Summarize lecture 7 in detail"
     "Searching ${classMapping[namespaceToSearch]}..."
  
    - Query: "Explain lecture 10 and how it relates to the practice prelim"
     "Searching ${classMapping[namespaceToSearch]}..."
  
    - Query: "What is the weather for today?"
      "Searching..."

    - Query: "What are Einsteins equations? What is the quadratic equation?"
      "Searching ..."
  
    - Query: "What lectures talk about SQL"?
      "Searching ${classMapping[namespaceToSearch]}..."
   
    - Query: "Give me an overview of the grade distribution"
       "Searching ${classMapping[namespaceToSearch]}..."
   
    - Query: "Summarize chapter 15 of the textbook"
      "Searching ${classMapping[namespaceToSearch]}..."
    )`
  }


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
            { $inc: { messagesLeft: -1 } });
        }
      }
    } 
    const chatHistoryCollection = db.collection("chatHistories");
    const chatSessionCollection = db.collection('sessionIDs');
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    //In the case that the user is using the course catalog we don't need to make an extra call to gpt api
    //We are always using the Course Catalog namespace in the pinecone
    if(namespace === 'Course Catalog'){
      const modelForResponse = new OpenAIChat({
        temperature: 0.1,
        modelName: "gpt-4-1106-preview",
        cache: true,
      });
      //init class
      const qaChain = CoursesCustomQAChain.fromLLM(modelForResponse, index, ['Course Catalog'], {
        returnSourceDocuments: true,
        bufferMaxSize: 4000,
      });

      const results = await qaChain.call({
        question: sanitizedQuestion,
        chat_history: messages,
        namespaceToFilter: namespace
      });
      
      const message = results.text;
      const sourceDocs = null;

      //save message to the database before displaying it
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
        message,
        sourceDocs,
      };
      res.status(200).json(data);
  }

    const model = new OpenAIChat({
      temperature: 0.1,
      modelName: "gpt-4-1106-preview",
      cache: true,
  });

    // const processedMessages = messages.map((messageObject: { message: any; }) => messageObject.message);

    const fewShotPrompt = createPrompt(namespace, messages);

    const reportsPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(fewShotPrompt),
      new MessagesPlaceholder('chat_history'),
      HumanMessagePromptTemplate.fromTemplate('{query}'),
    ]);


    const chain = new ConversationChain({
      memory: new BufferMemory({ returnMessages: true, memoryKey: 'chat_history' }),
      prompt: reportsPrompt,
      llm: model,
    })


    const response = await chain.call({
      query:sanitizedQuestion,
    });


    console.log('response from chain.call in chat.ts', response.response);


    const extractedNumbs = await extractTitlesFromQuery(response.response);
    // const numbsArray: string[] | undefined = extractedNumbs as string[] | undefined;
   

    const namespaces = extractedNumbs;            


    console.log(namespaces, 'namespace in chat.ts');

    const modelForResponse = new OpenAIChat({
      temperature: 0.1,
      modelName: "gpt-4-1106-preview",
      cache: true,
    });


    //init class
    const qaChain = CustomQAChain.fromLLM(modelForResponse, index, namespaces, {
      returnSourceDocuments: true,
      bufferMaxSize: 4000,
    });


    console.log('searching namespace for results...');
  
    const results = await qaChain.call({
      question: sanitizedQuestion,
      chat_history: messages,
      namespaceToFilter: namespace
    });


    const message = results.text;
    const sourceDocs = results.sourceDocuments;

    //save message to the database before displaying it
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
