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
import * as fs from 'fs/promises'
import connectToDb from '@/config/db';
import { CoursesCustomQAChain } from '@/utils/coursesCustomqachain';

export const maxDuration = 100; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';
 
export function GET(request: Request) {
  return new Response('Vercel', {
    status: 200,
  });
}


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

    "PUBPOL 2350": [
      'PUBPOL_2350 Disparities_2023',
      'PUBPOL_2350 International Comparisons_2023',
      'PUBPOL_2350 International Comparisons_Part_2_2023',
      'PUBPOL_2350 Malpractice_2023',
      'PUBPOL_2350 Pharma and Biotech_Management_2023',
      'PUBPOL_2350 Pharma and Biotech_Policy_2023',
      'PUBPOL_2350 Pharma and Biotech_Policy_Part_2_2023',
      'PUBPOL_2350 Quality_2023',
      'PUBPOL_2350 Reform_Alternative_2023'
  ],
  "INFO 2950": [
    'INFO 2950 FA23_Midterm_QuestionSheet',
    'INFO 2950 Final Fall 2023 - Review Topics',
    'INFO 2950 INFO 2950 Fall 2022 Midterm Solutions',
    'INFO 2950 INFO 2950 Final Fall 2022 questions',
    'INFO 2950 INFO2950_FA22_MidtermQuestions',
    'INFO 2950 INFO2950_Koenecke_Syllabus',
    'INFO 2950 INFO2950_Lec1_20230821',
    'INFO 2950 INFO2950_Lec2_20230823',
    'INFO 2950 INFO2950_Lec3_20230828',
    'INFO 2950 INFO2950_Lec4_20230830',
    'INFO 2950 INFO2950_Lec5_20230906',
    'INFO 2950 INFO2950_Lec6_20230911',
    'INFO 2950 INFO2950_Lec7_20230913',
    'INFO 2950 INFO2950_Lec8_20230918',
    'INFO 2950 INFO2950_Lec9_20230920',
    'INFO 2950 INFO2950_Lec10_20230925',
    'INFO 2950 INFO2950_Lec11_20230927',
    'INFO 2950 INFO2950_Lec12_20231004',
    'INFO 2950 INFO2950_Lec13_20231011',
    'INFO 2950 INFO2950_Lec14_20231016',
    'INFO 2950 INFO2950_Lec15_20231018 2',
    'INFO 2950 INFO2950_Lec16_20231023 2',
    'INFO 2950 INFO2950_Lec17_20231025 2',
    'INFO 2950 INFO2950_Lec18_20231030',
    'INFO 2950 INFO2950_Lec19_20231101',
    'INFO 2950 INFO2950_Lec20_20231106',
    'INFO 2950 INFO2950_Lec21_20231108',
    'INFO 2950 INFO2950_Lec22_20231113',
    'INFO 2950 INFO2950_Lec23_20231115 2',
    'INFO 2950 INFO2950_Lec24_20231120 2',
    'INFO 2950 INFO2950_Lec25_20231127 2',
    'INFO 2950 INFO2950_Lec26_20231129 2',
    'INFO 2950 INFO2950_Lec27_20231204 2',
    'INFO 2950 INFO2950-Handbook',
    'INFO 2950 Lec 20 clarification examples 20231106',
    'INFO 2950 Lec10_ChalkboardExample_20230925',
    'INFO 2950 Midterm Fall 2023 - Review Topics',
    'INFO 2950 FA23_Midterm_Solutions'
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
    console.log((req.method),"Chat.ts request")
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
    if(namespace === 'Course Finder SP24'){
      const modelForResponse = new OpenAIChat({
        temperature: 0.1,
        modelName: "gpt-3.5-turbo-1106",
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
      return;
  }

    console.log('CHAT.TS RUNS AGAIN');

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