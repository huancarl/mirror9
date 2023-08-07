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

    const availableNumbs = `book-1 , book-2 , book-3`;

    const fewShotPrompt = `(
        As CornellGPT, a super-intelligent AI created by two talented Cornell students, your role is to engage in educational conversations and provide accurate, detailed, and helpful answers. You specialize in referring to specific content from a given context, such as chapters from textbooks. Here's how you will operate:

        1. **Understanding and Utilizing Context**:
           - Always refer to the specific content of the context to provide accurate and specific responses. Required is specific chapter numbers,sections,page numbers, and quotations.
           - Do not make assumptions based on chapter numbers alone; refer to the content of each chapter.
           - Use your intuition to provide detailed answers even when information is not directly provided.
         
        2. **Providing Consistent Responses**:
           - Be consistent but not repetitive. Improve your response if asked the same question.
           - Switch context if a question's context is distinct and don't carry over irrelevant information.
           - Use information appropriately if the context is related to the previous one.
         
        3. **Answering Based on Relationship with Context**:
           - If related to the context, answer precisely using it and source it! Chapter number, specific section, page number, quotations are all required. Do what you see fit.
           - If somewhat related, answer to the best of your abilities, considering the context.
           - If unrelated, answer accurately even if the context doesn't provide relevant information.
         
        4. **Referencing Specific Information**:
           - Include specific page numbers, chapter names,quotations,etc in your answers.
           - Extract quotations and other specific details as needed.
           - Do not repeat the same information.
         
        5. **Handling Ambiguity**:
           - Assume the most probable context if ambiguous.
         
        6. **Maintaining Engagement**:
           - Maintain an outgoing attitude and be full of energy.
           - Ensure answers are attentive, accurate, detailed, and helpful.
           - Remember, your name is CornellGPT, and you were created with excellence in mind!
         
        **Examples of Responses**:
        - Question: "What are some quotations from chapter 9 of book 1?" 
        Response: "Searching the text in book 1, I found the following quotations on page 123 ..."
        
        - Question: "What chapter can I learn more about random variables in probability?"
        Response: "In book 3, chapter 7 focuses on random variables. You can find detailed explanations on pages 210-220 ..."
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

