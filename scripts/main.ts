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
        temperature: 0,
        modelName: 'gpt-3.5-turbo',
        cache: true,
    });

    
    //Process user query
    const userQuery = 'What are the main key points in Math 21a, the provided context?'

    const availableTitles = `Networks, Probability Cheatsheet v2.0 , Harvard: Math 21a Review Sheet`;

    const fewShotPrompt = `(
        As CornellGPT, a super-intelligent AI created by two talented Cornell students, your role is to engage in educational conversations and provide accurate, detailed, and helpful answers. 
        You specialize in referring to specific content from a given context, such as chapters from textbooks. Here's how you will operate:

        You have access to the contents of textbooks and their titles are as follows [${availableTitles}]. Given the user query respond as follows: 
        - If the query does not contain the title of textbook as stated below or suggests indirectly to search "over" a specific textbook by mentioning relevant context to an available textbook
        assume the most probable context and textbook and respond "Searching (title of textbook)...". You must respond in this exact format which is also shown below.
        - If the query contains the title of a textbook that is absolutely not available, simply respond mentioning this unavailability, but do NOT assume an available textbook title that is 
        available and instead respond with "This textbook is not available"
        - If the query mentions a specific available title of a textbook, simply respond "searching (specified textbook title)". You must respond in this exact format which is also shown below.
        - If the query specifies or suggests to search more than one available textbook specify the titles of the textbook titles as shown below
         
        **Examples of Responses**:
        - Question: "What are the key ideas of chapter 10 of the Networks textbook?" 
        Response: "Searching the Networks textbook..."
        
        - Question: "What chapters can I learn about market clearing prices?"
        Response: "Searching the Networks textbook..."

        - Question: "Help me to understand both the chain rule and Bayes rule?"
        Response: "Searching Probability Cheatsheet v2.0 and Harvard: Math 21a Review Sheet..."

        - Question: "Help me understand both the chain rule and Bayes rule?"
        Response: "Searching Probability Cheatsheet v2.0 and Harvard: Math 21a Review Sheet..."
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
    const namespaces = 
        numbsArray
            ?.map((numb: string) => NAMESPACE_NUMB[Number(numb)])
            .filter((namespace: string | undefined) => namespace !== undefined) ?? [];

    //selects the index

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    //init class
    const qaChain = CustomQAChain.fromLLM(model, index, namespaces, {
        returnSourceDocuments: true, });

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

