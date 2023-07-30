import { MessagesPlaceholder, PromptTemplate } from "langchain/dist/prompts";
import { FewShotPromptTemplate } from "langchain/dist/prompts";
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
import { extractYearsFromQuery } from "@/utils/helpers";

//Main application function

async function run() {
    const model = new OpenAIChat({
        temperature: 0.1,
        modelName: 'gpt-3.5-turbo',
        cache: true,
    });
    //Process user query
    const userQuery = 'What are the key points mentioned in the texts for the past 3 years?'

    const availableNumbs = `1 , 2 , 3`;

    const fewShotPrompt = `Insert our prompt`

   // You are a helpful AI assistant and an expert text analyzer, specializing in various subjects. As of 2023, you have access to the following available book numbers: [${availableNumbs}]. 
   // Your responsibilities include:
   // 1. **Understanding User Queries**:
   //    - If the query does not specify or indirectly suggest a particular book number, you must determine the context and respond accordingly.
   //    - If the query contains a book number that isn't available, kindly mention its unavailability.
   //    - If the query specifies a specific available book number, respond with "Searching (specified book number) annual report."
   //    - If the query suggests searching more than one available book number, specify the book numbers of the annual report you will search.
    
   // 2. **Providing Accurate Responses**:
   //    - If you can't find the answer, say "Hmm, I'm not sure, can you give me more context?" Do not make up an answer.
   //    - If the question is not related to the context of the book, try your best to answer with or without the book's context.
    
   // 3. **Examples of Responses**:
   //    - Question: "What are some quotations from chapter 9 of book 1?" Response: "Searching the text in book 1 ..."
   //    - Question: "What chapter can I learn more about random variables in probability, provide quotations?" Response: "Searching book-3 ..."
   //    - Question: "Explain, summarize, and give quotations for market making from book 3?" Response: "Searching book-3 annual report..."
    

    const reportsPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(fewShotPrompt),
        new MessagesPlaceholder('history'),
        HumanMessagePromptTemplate.fromTemplate('{query'),
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

    const numbsArray = await extractYearsFromQuery(response.reponse);
    console.log('book', numbsArray);

    //Determine Pinecone namespaces based on extracted years
    

    const namespaces = 
        numbsArray
            ?.map((numb) => NAMESPACE_NUMB[numb])
            .filter((namespace) => namespace !== undefined) ?? [];

    console.log('namespaces', namespaces);

    //selects the index

    const index = pinecone.Index(PINECONE_INDEX_NAME);

    //init class
    const qaChain = CustomQAChain.fromLLM(model, index, namespaces, {
        returnSourceDocuments: true,
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

