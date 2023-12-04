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
import axios from 'axios';


function cleanText(text) {
  // Removing lines containing only whitespace
  const cleaned = text.split('\n').filter(line => line.trim().length > 0).join(' ');
  return cleaned.replaceAll('  ', ' ').trim(); // Replace double spaces with single space
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  const { question, messages, userID, sessionID, namespace} = req.body;
  const image = req.body.image;

   const classMapping = {
    
  }

  function createPrompt(chat_history: any){
    return `(
     
      Your mission is to determine when and what to search based on the user query of the class.
      Here is the list of classes: ${classMapping}.
      
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
     "Searching ${classMapping}..."
  
    - Query: "Explain lecture 10 and how it relates to the practice prelim"
     "Searching ${classMapping}..."
  
    - Query: "What is the weather for today?"
      "Searching..."

    - Query: "What are Einsteins equations? What is the quadratic equation?"
      "Searching ..."
  
    - Query: "What lectures talk about SQL"?
      "Searching ${classMapping}..."
   
    - Query: "Give me an overview of the grade distribution"
       "Searching ${classMapping}..."
   
    - Query: "Summarize chapter 15 of the textbook"
      "Searching ${classMapping}..."
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

    const model = new OpenAIChat({
      temperature: 0.1,
      modelName: "gpt-4-1106-preview",
      cache: true,
  });

    const fewShotPrompt = createPrompt(messages);

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
