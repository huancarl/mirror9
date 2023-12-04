import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAIChat } from "langchain/llms/openai";
import {
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate,
    MessagesPlaceholder
} from 'langchain/prompts'
import { BufferMemory, ChatMessageHistory,} from "langchain/memory";
import { ConversationChain } from "langchain/chains";

class RateLimiter {
    private static requestCount = 0;
    private static startTime = Date.now();
    private static maxRequestsPerMinute = 200;


    static async handleRateLimiting() {
        const currentTime = Date.now();
        if (currentTime - this.startTime > 60000) {
            this.requestCount = 0;
            this.startTime = currentTime;
        }


        this.requestCount++;
        if (this.requestCount > this.maxRequestsPerMinute) {
            await new Promise(resolve => setTimeout(resolve, 60000 - (currentTime - this.startTime)));
            this.requestCount = 1;
            this.startTime = Date.now();
        }
    }
}


class ChatHistoryBuffer {
    private buffer: string[];
    private maxSize: number;


    constructor(maxSize: number) {
        this.buffer = [];
        this.maxSize = maxSize;
    }


    addMessage(message: string) {
        this.buffer.push(message);
        this.trim();
    }


    getChatHistory(): string {
        return this.buffer.join(' ');
    }


    clear() {
        this.buffer = [];
    }


    private trim() {
        while (this.buffer.length > this.maxSize) {
            this.buffer.shift();
        }
    }
}

interface Metadata {
    text: string;
    source: string;
    pageNumber: number;
    totalPages: number;
    chapter?: number;   // Optional, if not all documents have chapters
    book?: string;      // Optional, if not all documents are from books
  }

interface PineconeResultItem {
    metadata: Metadata;
    values: any;
    text: any;
    value: {
        text: string;
        source: string;
        pageNumber: number;
        totalPages: number;
        chapter?: number;
        book?: string;
        score : any;
    };
}

interface CallResponse {
    text: string;
    sourceDocuments: Array<{
        text: string;
        Source: string;
        Page_Number: number;
        Total_Pages: number;
    }>;
}


interface CustomQAChainOptions {
    returnSourceDocuments: boolean;
    bufferMaxSize: number;
}

export class CustomQAChain {
    private model: OpenAIChat;
    private index: any;
    private namespaces: string[];
    private options: CustomQAChainOptions;
    private chatHistoryBuffer: ChatHistoryBuffer;
    


    constructor(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions) {
        this.model = model;
        this.index = index;
        this.namespaces = namespaces;
        this.options = options;
        this.chatHistoryBuffer = new ChatHistoryBuffer(this.options.bufferMaxSize);


        if (typeof this.index.query !== 'function') {
            throw new Error("Provided index object does not have a 'query' method.");
        }
    }


    public static fromLLM(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions): CustomQAChain {
        return new CustomQAChain(model, index, namespaces, options);
    }


    private sanitizeResponse(input: string): string {
        // Only remove the last occurrence of the "+" sign, which is used by OpenAI as a token to indicate the end of the response.
        const sanitized = input.replace(/ \+$/, '');
        return sanitized;



    }
    private async retryRequest<T>(request: () => Promise<T>, maxRetries = 5, delay = 1000, maxDelay = 60000) {
        for (let i = 0; i <= maxRetries; i++) {
            await RateLimiter.handleRateLimiting();
            try {
                return await request();
            } catch (error: any) {
                if (i === maxRetries || ![429, 401,400, 502, 503, 504].includes(error.response?.status)) {
                    throw error;
                }
                delay = Math.min(delay * 2, maxDelay);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    private async getRelevantDocs(question: string, filter: any): Promise<PineconeResultItem[]> {
        const embeddings = new OpenAIEmbeddings();
        const queryEmbedding = await embeddings.embedQuery(question);
    
        if (!queryEmbedding) {
            throw new Error("Failed to generate embedding for the question.");
        }
    
        let fetchedTexts: PineconeResultItem[] = [];
        let remainingDocs = 100;                      // max vector search, adjust accordingly till find optimal
    
        const maxNamespaces = 30;
        const namespacesToSearch = this.namespaces;

    
        for (const namespace of namespacesToSearch) {
            const queryResult = await this.retryRequest(async () => {
                return await this.index.query({
                    queryRequest: {
                        vector: queryEmbedding,
                        topK: 30,
                        namespace: namespace,
                        includeMetadata: true,
                    },
                });
            });
    
            let ids: string[] = [];
            if (queryResult && Array.isArray(queryResult.matches)) {
                ids = queryResult.matches.map((match: { id: string }) => match.id);
            } else {
                console.error('No results found or unexpected result structure.');
            }
    
            const numToFetch = Math.min(ids.length, remainingDocs);
    
            if (numToFetch > 0) {
                const fetchResponse = await this.retryRequest(async () => {
                    return await this.index.fetch({
                        ids: ids.slice(0, numToFetch),
                        namespace: namespace,
                    });
                });
    
                const vectorsArray: PineconeResultItem[] = Object.values(fetchResponse.vectors) as PineconeResultItem[];
                fetchedTexts.push(...vectorsArray);
                remainingDocs -= vectorsArray.length;
            }
    
            if (remainingDocs <= 0) {
                break;
            }
        }
    
        return fetchedTexts;  
    }

    public async call({ question, chat_history, namespaceToFilter}: { question: string; chat_history: string, namespaceToFilter: any}, ): Promise<CallResponse> {
       
        const relevantDocs = await this.getRelevantDocs(question, namespaceToFilter);

        this.chatHistoryBuffer.addMessage(chat_history);
        // console.log(this.namespaces, 'name of namespaces');

        const sourceDocuments = relevantDocs.map(vector => {
            return {
                text: vector.metadata.text,
                "Source": vector.metadata.source,
                'Page_Number': vector.metadata['loc.pageNumber'],
                'Total_Pages': vector.metadata['pdf.totalPages']
                // "Chapter": vector.metadata["chapter"]
            };
        });  

        const formattedSourceDocuments = sourceDocuments.map((doc, index) => {
            // Remove newlines and excessive spacing from the text
            const cleanedText = doc.text.replace(/\s+/g, ' ').trim();
            return `- Text: "${cleanedText}", Source: "${doc.Source}", Page Number: ${doc.Page_Number}, Total Pages: ${doc.Total_Pages}`;
          }).join('\n');
       
        const prompt = `
        

        You are CornellGPT, you are a super-intelligent AI created by two brilliant Cornell students, 
        your primary role is to guide Cornell University students on the courses offered by Cornell students.
        Remember your founders and creators are Cornell students. You are an AI developed by two Cornell students. Never mention OpenAI.
       
        You are a expert on the courses: ${namespaceToFilter} and have access to ${this.namespaces} as such. 
        You will always answer questions from the user pertaining to the class: ${namespaceToFilter}, 
        searching and using ${this.namespaces} extensively for the accurate answers, and using ${chat_history} to navigate your conversation.
        You must judge the relevancy of every user's question to ${namespaceToFilter} and ${this.namespaces}

        Always assume that the context is: ${namespaceToFilter}. Thus, always answer in the context of ${namespaceToFilter} searching ${this.namespaces} when applicable for the answer extensively.
        Always assess if the question is relevant to ${this.namespaces} and or ${namespaceToFilter} as you answer. Search thoroughly as possible through ${this.namespaces} to look to answer the users' questions.
        Remember you are an expert on the course and have access to ${this.namespaces} & ${namespaceToFilter}. Always be certain when you are answering 
        and use ${sourceDocuments} effectively to answer. If it is not explicitly mentioned in the context do no mention it or make up answers, or say if something likely exists.
        Look for the answer in ${this.namespaces} extensively and accurately.

        If the question is not relevant at all or you do not have access to the specific thing being asked for by the user, 
            then assert to the user: "I may not have access to the specific information being requested at this time 
            and or this question may not be relevant to ${namespaceToFilter}. if this question is related to ${namespaceToFilter} , please allow the handsome founders to update CornellGPT
            in relation to ${namespaceToFilter}, however I can provide you guidance..." then answer the question to the best of your ability.
            Never make up answers or fabricate what it might have.

        If the question is general or a simple question like "What is 2+2", then answer accordingly, but assert to the user that this is not relevant to ${namespaceToFilter}
        Never ever make up answers, or give answers that you are uncertain about. 
        Always give long, full, accurate, specific, detailed, and helpful answers to the questions.
        Always understand in detail and clarity what the question is asking you.
        (You have the ability to speak every language)
       
        Contextual Understanding:
        - The class contents that you have access which are all apart of the class ${namespaceToFilter} are as follows: ${this.namespaces}.
        - When asked specifically about a certain ${this.namespaces}, provide as much specific detail as possible and do not forget to mention details
          relevant to the question. You must answer the question to the highest accuracy using ${this.namespaces} and find the best possible answer to the question.
        - When responding to questions about where a user wants to find which ${this.namespaces} contains specific information, ensure to answer and list with precision all ${this.namespaces} that contains that specific information.
        - Never make up contexts, answers, or details that do not exist. If it is not explictly mentioned in the context do no mention it or make up answers.
        - Search ${this.namespaces} extensively when answering relevant questions when applicable

        Reference Citing:
        - The source materials that you are given access to are as follows: ${formattedSourceDocuments}. 
        - You will select the most relevant, accurate, detailed parts of the course materials to fully develop your accurate answer. 
        - You must always cite the source name (just the pdf) and page numbers when possible in parenthesis throughout the response. Place multiple citations with source and page number throughout the response where you used them. Never put them at the end of your response. 
        - Never make up information beyond or deviate from the explicit, exact information found in the source materials or incorrectly source answers. 
        - If the user asks something about the class you do not have access to, then state that you do not have access to that specifically yet.
        - If information is not elaborated upon in the course materials simply state the information as is, never make assumptions from the course materials.

        {chat_history}:
        - You have access to the entire conversations with user. Do not forget prior messages. Chat History (from oldest to most recent messages). 
        - You must understand that chat history is broken up by the user's messages and your very own answers. Understand this as you interpret chat history.
        - You must assess whether a question be a continuation of the conversation or entirely new. 
            - If the question is continuation of the conversation, then assume the context to be continued as you develop your answers.
            - Do not repeat your answers
            - If a question context is distinctive from the conversation, transition to the new context. 

        You must check chat history before assessing the following:
        - Directly related: Use course materials to respond accurately,precisely, explicitly, and detailed.
        - Ambigious: If the context isn't directly related to the class, utilize feedback query. Simply ask the user to clarify for more information/details or specifics.
        - Unrelated: You must state to the user that it is unrelated to ${namespaceToFilter} and to navigate to the right class on CornellGPT. Do not makeup an answer.
       


        Feedback Queries:
        - If a query lacks explicitness and if you believe that the provided context does not cover the specifics of the question and is not relevant to the previous conversations from chat history, proactively ask the user for more specific details.
        - Your goal with feedback queries is not just to gather more information, but to ensure the user feels guided and understood in their educational journey. 
        - Do not be afraid to ask questions that will guide yourself and the user to the right answer.

        Query Situation:
        - Should you be posed with the same query again, view it as an opportunity to deliver an even more insightful response.
        - While relevance is key, your answers shouldn't be a mere repetition. Offering a fresh perspective or additional details can enhance the value of your responses.
       
        Engagement Tone:
        - Your interactions should exude positivity and humor. Engage with a confident, outgoing attitude and full energy, keeping in mind your identity as CornellGPT, a creation of two exceptional Cornell students.
        - Refrain from apologizing and saying "I am sorry". You are here to help and assist students. Avoid words such as 'could' or 'might' or "may". Always be certain about your answers.

        Mathematical Inquires:
        - You must surround any math expression, notation, number, variables, anything related to Math with $. For example: $ax^2 + bx + c = 0$.

        You must follow this formatting when you develop your answers:
        1. Bold Text: Use bold text in your messages to emphasize key terms, main topics, important points, or steps in a process. 
        2. Lists: Use bulleted and numbered lists when providing a sequence of steps, summarizing, ranking items, or listing items in a long or specific order.
        3. Italic Text: Use italic text for titles of books, articles, or other publications. You can also use it to emphasize words that require special attention from the reader. Italicize sources.
        4. Bullet Points: Use bullet points to organize information into a clear and concise list. This is particularly useful for breaking down complex topics, outlining steps in a process, or listing items.
           - Sub-points can be used for additional details or to elaborate on a main point.
        5. Links: Make all links bolded
        6. Consistency: Maintain consistency in your formatting throughout the response. This helps in providing a professional and polished look to your answers.
        7. Readability: Ensure that your responses are easy to read. Use clear and concise language, and break down complex ideas into simpler terms when necessary.
        8. Spacing and Alignment: Pay attention to the spacing and alignment of text and other elements in your response. Proper spacing and alignment contribute to the overall readability and aesthetic of the response.
        9. You must put citations in parenthesis throughout the response. Do not put them at the end.
        `;

        const reportsPrompt = ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(prompt),
            new MessagesPlaceholder('chat_history'),
            HumanMessagePromptTemplate.fromTemplate('{query}'),
          ]);
        
        const history = new BufferMemory({ returnMessages: true, memoryKey: 'chat_history' });
        for (let i = 0; i < chat_history.length; i += 2) {
            history.saveContext([chat_history[i]], [chat_history[i+1]]);
        }
        
        const chain = new ConversationChain({
            memory: history,
            prompt: reportsPrompt,
            llm: this.model,
        });

          const prediction = await chain.call({
            query:question,
          });

        let response = await this.retryRequest(async () => {
            return await this.model.predict(prompt);
        });
        if (typeof response === 'undefined') {
            throw new Error("Failed to get a response from the model.");
        }

        response = this.sanitizeResponse(response);

        if (typeof prediction.response === 'string') {
            response = prediction.response;
        } else {
            throw new Error("Response Error.");
        }

        this.chatHistoryBuffer.addMessage(`Question: ${question}`);


        console.log(prompt, 'prompt');

    return {
        text: response,
        sourceDocuments: sourceDocuments
    };
}
}

