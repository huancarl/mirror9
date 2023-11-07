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

  const { question, history, userID, sessionID, namespace} = req.body;
  // const question = req.body.question;
  console.log('Received request body:', req.body);


  // console.log(question);


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
    "Other": "Probability Cheatsheet v2.0, Math 21a Review Sheet, Introduction To Probability"
  }


  function createPrompt(namespaceToSearch: string){
    return `(
     
      Your mission is to determine when and what to search based on the user query.
      Queries you receive will usually be related to ${namespaceToSearch} and ${classMapping[namespaceToSearch]}, but not always.
      
      Available Search Documents = ${classMapping[namespaceToSearch]}, ${namespaceToSearch}
      Chat History = ${history}
      Query = ${question}
  
      - Always respond like: "Searching(' ')..." or "Searching ..." Never deviate from this format.
  
      - Utilize the user's query for hints, explicit mentions, or any relation to source documents, search strictly and accordingly from the available search documents.
      - Be attentive, selective, and cautious about what to select. Do not select the wrong things. You must select the right things.
  
      - If the query relates to certain search documents, make sure to make the right selection.
      - If the query is unrelated to the search documents, then do not search, by returning "Searching..."
      - If the query can be answered quick and simply with an absolute answer like "What is 2+2", then do not search by returning "Searching..."
      - When faced with an ambiguous query, assess whether or not you should search. 
  
      - If multiple search documents are relevant and absolutely needed, then search accordingly. 
  
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
    const chatHistoryCollection = db.collection("chatHistories");
    const chatSessionCollection = db.collection('sessionIDs');

    const model = new OpenAIChat({
      temperature: 0.1,
      modelName: "gpt-4-1106-preview",
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
   

    const namespaces = extractedNumbs;            


    console.log(namespaces, 'namespace in chat.ts');


    //selects the index
    const index = pinecone.Index(PINECONE_INDEX_NAME);

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
      chat_history: history,
      namespaceToFilter: namespace
    });


    const message = results.text;
    const sourceDocs = results.sourceDocuments;

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
    console.log(currSession,'currSession/chat.ts');
    if (currSession && currSession.isEmpty === true){
      //update the document's .isEmpty field in mongodb
      console.log('currSession in chat.ts runs');
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
        // The days are different, update the name and date fields
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
