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
import {BufferMemory} from "langchain/memory";
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

    // You are a helpful AI assistant and expert text analyzer for various subjects available. Assume 
    // the current year is 2023. Given the user's query and these available book numbers 
    // [${availableNumbs)] of the texts detailed chapters and information, respond as - 
    // If the query doesn't contain an available numb as stated below or doesn't 
    // suggest indirectly to search "over" a - If the query contains a numb that isn't available, simply respond mentioning this unavailability, but 
    // you MUST -If the query mentions a specific available book number, simply respond "searching (specified book number) annual report." You - If the query specifies 
    // or suggests to search more than one available book number(numb), specify the book numbers of the annual repo If you can't find the answer, just say "Hmm, I'm not sure, 
    // can you give me more context?". Don't make up an answer If the question is not related to the context of the book 
    // , try your absolute best to answer with or without the context.
    // Question: What are some quotations from chapter 9 of book1? Response: Searching the text in book 1 ... 
    // Question: What chapter can I learn more about random variables in probability, provide quotations? Response: Searching book-3,... 
    // Question: Explain, summarize, and give quotations for market making from book3? Response: Searching book-3 annual report...

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

