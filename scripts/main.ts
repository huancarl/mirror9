import { MessagesPlaceholder, PromptTemplate } from "node_modules/langchain/dist/prompts";
import { FewShotPromptTemplate } from "node_modules/langchain/dist/prompts";
import { ChatOpenAI } from 'langchain/chat_models';
import { OpenAIChat } from "langchain/llms";
import { PINECONE_INDEX_NAME } from "@/config/pinecone";
import * as fs from 'fs/promises'
import {
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate,
} from 'langchain/prompts'
import { NAMESPACE_NUMB } from "@/config/pinecone";
import { ConversationChain } from "langchain/chains";
import { BufferMemory} from "langchain/memory";
import { pinecone } from "@/utils/pinecone-client";
import { CustomQAChain } from "@/utils/customqachain";
import { extractTitlesFromQuery } from "@/utils/helpers";

//Main application function

async function run() {
    const model = new OpenAIChat({
        temperature: 0.1,
        modelName: "gpt-4",
        cache: true,
    });

    
    // Process user query
    const userQuery = 'Can you explain the Median Voter Theorem and where I can find it?'

    const availableTextbooks = `Networks, Probability Cheatsheet v2.0 , Harvard: Math 21a Review Sheet, INFO 2950 Syllabus, Introduction To Probability`;
    
    const fewShotPrompt = `(
    
      You are CornellGPT, an advanced AI developed by two gifted Cornell students. 
    
      Your mission is to furnish accurate, detailed, and educational answers by referring to specified educational material only when asked a question that is relevant.
      If the question is not relevant to ${availableTextbooks}, then simply do not search the namespaces, and provide a accurate, detailed, precise answer as such.
      
      Here are the refined guidelines for your operation:
    
      ---Available Information: [${availableTextbooks}].
      
      -----Detailed Instructions**:
      1. Parse the user's query for subject hints or explicit textbook mentions.
      2. Match any identified subject to its most relevant information. If multiple fit, mention all probable ones.
      3. Always follow the response format: "Searching (title/s of the textbook/s)..." 
      4. Ensure to recognize specific chapter,page,totalpages, and section requests and treat them as direct references.
      5. When faced with an ambiguous query, utilize your training to pick the most relevant educational content If in doubt, list all potential matches.
      6. Do not give false answers or makeup answers.
    
      7. If the the question has no relevance at all with ${availableTextbooks}, then you do not need to analyze the material. 
         Instead answer with accuracy, precision and detail without analyzing the material.
      
    ----Enhanced Example Responses:
    Query = ${userQuery}
  
    - Query: "Can you elucidate on network structures and their importance?" 
      Response: "Searching the Networks textbook..."
    
    - Query: "I'd like to understand counting and thinking conditionally. Give me exact quotations to help my understanding."
      Response: "Searching Probability Cheatsheet v2.0..."
    
    - Query: "Where can I find detailed discussions on vector functions?"
      Response: "Searching Harvard: Math 21a Review Sheet..."

    - Query: "What is the grade breakdown for INFO 2950?"
      Response: "Searching INFO 2950 Syllabus..." 

    -Query: "Explain chapter 1 of the introduction to probability textbook"
    Response: "Searching Introduction To Probability textbook..." 
    
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
    )`

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
        query:userQuery,
    });

    console.log(response);

    const extractedNumbs = await extractTitlesFromQuery(response.response);
    const numbsArray: string[] | undefined = extractedNumbs as string[] | undefined;

    console.log('book', numbsArray);
    
    // Determine Pinecone namespaces based on extracted years
    // const namespaces = 
    //     numbsArray
    //         ?.map((title) => NAMESPACE_NUMB[title])
    //         .filter((namespace: string | undefined) => namespace !== undefined) ?? [];

    const namespaces = extractedNumbs

    //selects the index

    console.log('namespaces', namespaces)

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    //init class
    const qaChain = CustomQAChain.fromLLM(model, index, namespaces, {
        returnSourceDocuments: true, 
        bufferMaxSize: 4000,
      });

    const chatHistory = '';

    console.log('searching namespace for results...');

    const results = await qaChain.call({
        question: userQuery,
        chat_history: chatHistory,
    });
    
    console.log('results', results);

    const data = {
        response,
        numbsArray,
        namespaces,
        results,
    };

    const json = JSON.stringify(data);

    await fs.writeFile(`main-test-response.json`, json);
    
}

(async () => {
    await run();
    console.log('ingestion complete'); 
})();