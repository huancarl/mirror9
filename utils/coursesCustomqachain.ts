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
    courseID: string;
    title: string;
    subject: string;
    part: number;
  }

interface PineconeResultItem {
    metadata: Metadata;
    values: any;
    text: any;
    value: {
        courseID: string;
        title: string; 
        subject: string;
        part: number;
    };
}

interface CallResponse {
    text: string;
    sourceDocuments: Array<{
        courseID: string;
        title: string;
        subject: string;
        part: number;
    }> | null;
}


interface CoursesCustomQAChainOptions {
    returnSourceDocuments: boolean;
    bufferMaxSize: number;
}

export class CoursesCustomQAChain {
    private model: OpenAIChat;
    private index: any;
    private namespaces: string[];
    private options: CoursesCustomQAChainOptions;
    private chatHistoryBuffer: ChatHistoryBuffer;
    


    constructor(model: OpenAIChat, index: any, namespaces: string[], options: CoursesCustomQAChainOptions) {
        this.model = model;
        this.index = index;
        this.namespaces = namespaces;
        this.options = options;
        this.chatHistoryBuffer = new ChatHistoryBuffer(this.options.bufferMaxSize);


        if (typeof this.index.query !== 'function') {
            throw new Error("Provided index object does not have a 'query' method.");
        }
    }


    public static fromLLM(model: OpenAIChat, index: any, namespaces: string[], options: CoursesCustomQAChainOptions): CoursesCustomQAChain {
        return new CoursesCustomQAChain(model, index, namespaces, options);
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
        let remainingDocs = 5;                      // max vector search, adjust accordingly till find optimal

        const maxNamespaces = 10;
        const namespacesToSearch = this.namespaces;

    
        for (const namespace of namespacesToSearch) {
            const queryResult = await this.retryRequest(async () => {
                return await this.index.query({
                    queryRequest: {
                        vector: queryEmbedding,
                        topK: 5,
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
                courseID: vector.metadata.courseID,
                title: vector.metadata.title,
                subject: vector.metadata.subject,
            };
        });  

        const formattedSourceDocuments = sourceDocuments.map((doc, index) => {
            // Remove newlines and excessive spacing from the text
            return `- Class: ${doc.subject} ${doc.courseID} ${doc.title} Information for ${doc.subject} ${doc.courseID} ${doc.title}: "${doc}",`;
          }).join('\n');

        console.log(formattedSourceDocuments, 'formatted source docs for course catalog');
       
        const prompt = `
        

        You are CornellGPT, a super-intelligent AI developed by two brilliant Cornell University students. 
        Your primary role is to assist users, particularly students and faculty at Cornell University, 
        on the courses offered at the university, and make decisions for them if requested.
        
        As an expert in the courses represented by ${namespaceToFilter}, you have extensive access to ${this.namespaces}, 
        which you will use to provide accurate and detailed information. You must also develop your answer using ${formattedSourceDocuments}.
        With all this information give a complete detailed and guided answer to the user always.

        If you think the user would benefit with more details, then provide extra details for the user. 
        Be highly attentive of what the question is asking you and answer as such.
        

        Your Responsibilities Include:
        
        Course Guidance: Offer detailed information on courses, including class schedules, credit details, prerequisites, and instructors, using ${this.namespaces} and ${namespaceToFilter} and ${formattedSourceDocuments}.
        Course Decisions: Make accurate decisions if requested. Your job is to answer the question accurately and always assist the user with whatever they are asking.
        Scheduling Assistance: Help users build their academic schedules, suggesting courses based on their interests, majors, etc.
        Credit and Major Requirements: Advise on credit accumulation,distributions, and how courses align with major requirements.
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
        Instead of saying "Subject: INFO. Course number: 2950. Title of course: Introduction to Data Science" say
        "INFO 2950: Introduction To Data Science". Use this format every time you need to mention a class.

        Do not give blank course information. For example do not do this: "Class breadth:   ". 

        
        Response Guidelines:
        
        If a question is not relevant to ${namespaceToFilter} or outside your access scope, guide users as best as you can.
        For general or simple questions unrelated to ${namespaceToFilter}, provide a direct answer 
        but remind users of the primary academic focus of your role centering around Cornell courses.
        In cases of ambiguity, ask users for clarification to ensure accurate and relevant responses.
        Maintain a user-centric approach, tailoring your guidance to individual needs and queries.

        Response Formatting:

        Use a numbered list followed by the class details when talking about classes, for example: "

        1. CS 3410: Computer System Organization and Programming (bold this)
        - Course Description: Introduction to computer organization, systems programming, and the hardware/software interface. Topics include instruction sets, computer arithmetic, datapath design, data formats, addressing modes, memory hierarchies, I/O devices, and multicore architectures.
        - Prerequisite: CS 2110 or equivalent programming experience.
        - Instructor: Hakim Weatherspoon
        - Class Type: Lecture
        - Time: 10:10AM - 11:25AM
        - Session Length: Regular Academic Session
        etc
        "


        Engage users with positivity, humor, and an outgoing attitude, reflecting your identity as CornellGPT, a creation of Cornell students.
        Ensure clarity in communication, speaking all languages to accommodate diverse user needs.
        Always give an organized and easy to read response.
       
        `;

        /** Chat Prompt Template */

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


        //console.log(prompt, 'prompt');

    return {
        text: response,
        sourceDocuments: null
    };
}
}

