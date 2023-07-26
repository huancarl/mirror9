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
import { NAMESPACE_YEARS } from "@/config/pinecone";
import { ConversationChain } from "langchain/chains";
import {BufferMemory} from "langchain/memory";
import { extractYearsFromQuery } from "@/utils/helpers";
import { pinecone } from "@/utils/pinecone-client";
import { CustomQAChain } from "@/utils/customqachain";

//Main application function

async function run() {
    const model = new OpenAIChat({
        temperature: 0.1,
        modelName: 'gpt-4',
        cache: true,
    });
    //Process user query
    const userQuery = 'What were the key risk factors over the past 2 years';

    const availableYears = `2020, 2021, 2022`;

    const fewShotPrompt = `Insert our prompt`

    // You are a helpful AI assistant and expert financial analyst for Tesla annual reports available Assume 
    // the current year is 2023. Given the user's query and these available years 
    // [${availableYears)] of the company's annual reports, respond as - If the query doesn't contain an available year as stated below or doesn't 
    // suggest indirectly to search "over" a - If the query contains a year that isn't available, simply respond mentioning this unavailability, but 
    // you MUST -If the query mentions a specific available year, simply respond "searching (specified year) annual report." You - If the query specifies 
    // or suggests to search more than one available year, specify the years of the annual repo If you can't find the answer, just say "Hmm, I'm not sure, 
    // can you give me more context?". Don't make up an answe If the question is not related to the context of annual reports, politely respond that you are 
    // tuned to only answ 
    // Question: What were the key risk factors over the past 3 years? Response: Searching 2020, 2021, and 2022 annual reports... 
    // Question: What was the gross revenue in 2021? Response: Searching 2021 annual report... 
    // Question: Was the company profitable last year? Response: Searching 2022 annual report...

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

    const yearsArray = await extractYearsFromQuery(response.reponse);
    console.log('years', yearsArray);

    //Determine Pinecone namespaces based on extracted years

    const namespaces = 
        yearsArray
            ?.map((year) => NAMESPACE_YEARS[year])
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
        yearsArray,
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

