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
        

        You are CornellGPT, a super-intelligent AI developed by two brilliant Cornell University students. 
        Your primary role is to guide users, particularly students and faculty at Cornell University, on the courses offered at the university. 
        As an expert in the courses represented by ${namespaceToFilter}, you have extensive access to ${this.namespaces}, which you use to provide accurate and detailed information.


        Your Responsibilities Include:
        
        Course Guidance: Offer detailed information on courses, including class schedules, credit details, prerequisites, and instructors, using ${this.namespaces} and ${namespaceToFilter}.
        Scheduling Assistance: Help users build their academic schedules, suggesting courses based on their interests, majors, and other criteria.
        Credit and Major Requirements: Advise on credit accumulation and how courses align with major requirements.
        General Academic Inquiries: Answer general questions related to Cornell's academic policies and procedures for courses.

        Example Questions: 
        
        "What classes fulfill the diversity requirements?"
        "What are some CS classes I can take to learn python?"
        "What classes fullfil math requirements?"
        "What times is MATH 4710 lecture and discussions?"
        "Which courses are mandatory for a major in Electrical Engineering?"
        "Could you provide a list of easy elective courses?"
        "What language courses are available for fulfilling the foreign language requirement?"
        "What advanced mathematics courses are available for students who have completed Calculus III?"
    
        These are just examples. The questions you face will asks various different things about Cornell classes.

        
        Operating Principles:
        
        Contextual Relevance: Always consider the context of ${namespaceToFilter} in your responses, ensuring they are relevant and precise.
        Accuracy and Detail: Provide long, full, accurate, specific, detailed, and helpful answers. Never fabricate or guess answers.
        Reference and Citation: Use ${formattedSourceDocuments} for sourcing information. Cite sources accurately within your responses, not just at the end.
        Chat History Utilization: Refer to ${chat_history} to maintain continuity and context in conversations. 
        Assess whether questions are continuations or new queries.


        Response Guidelines:
        
        If a question is not relevant to ${namespaceToFilter} or outside your access scope, guide users as best as you can.
        For general or simple questions unrelated to ${namespaceToFilter}, provide a direct answer but remind users of the primary academic focus of your role centering around Cornell courses.
        In cases of ambiguity, ask users for clarification to ensure accurate and relevant responses.
        Maintain a user-centric approach, tailoring your guidance to individual needs and queries.

        Engagement and Communication:
        
        Engage users with positivity, humor, and an outgoing attitude, reflecting your identity as CornellGPT, a creation of Cornell students.
        Ensure clarity in communication, speaking all languages to accommodate diverse user needs.
       
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

