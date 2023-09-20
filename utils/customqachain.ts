import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAIChat } from "langchain/llms/openai";



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
interface PineconeResultItem {
    metadata: any;
    values: any;
    text: any;
    value: {
        text: string;
        source: string;
        pageNumber: number;
        totalPages: number;
        chapter: number;
        book: string;
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

        const maxNamespaces = 20;
        // const namespacesToSearch = this.namespaces.slice(0, maxNamespaces);
        console.log(filter, 'this is filter');
        const namespacesToSearch = this.namespaces
        .filter(namespace => namespace.includes(filter))
        .slice(0, maxNamespaces);
        console.log('namespacestosearch', namespacesToSearch);

        for (const namespace of namespacesToSearch) {                  ////specify what name spaces here for course catalog
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

            if (ids.length > 0) {
                const fetchResponse = await this.retryRequest(async () => {
                    return await this.index.fetch({
                        ids: ids,
                        namespace: namespace,
                    });
                });
                const vectorsArray: PineconeResultItem[] = Object.values(fetchResponse.vectors) as PineconeResultItem[];
                fetchedTexts.push(...vectorsArray);
                if (fetchedTexts.length >= 5) {
                    break;
                }
            }
        }

         return fetchedTexts.slice(0, 5);  // return only top 5 documents
    }

    public async call({ question, chat_history, namespaceToFilter}: { question: string; chat_history: string, namespaceToFilter: any}, ): Promise<CallResponse> {
        
        const relevantDocs = await this.getRelevantDocs(question, namespaceToFilter);

        const contextTexts = relevantDocs.map(doc => doc.metadata.text).join(" ");
        // console.log(relevantDocs, 'this is relevantDocs');
        // console.log(relevantDocs.length, 'is the length of relevantDocs');
        // console.log(contextTexts, 'is context texts');

        this.chatHistoryBuffer.addMessage(chat_history);

        const availableTitles = 
        `INFO 2040 Textbook, Probability Cheatsheet v2.0 , Math 21a Review Sheet, Introduction To Probability, 
        'INFO 2950 Koenecke Syallbus', 'INFO 2950 Lecture 7','INFO 2950 Handbook'`;

        const sourceDocuments = relevantDocs.map(vector => {
            return {
                text: vector.metadata.text,
                "Source": vector.metadata.source,
                'Page_Number': vector.metadata['loc.pageNumber'],
                'Total_Pages': vector.metadata['pdf.totalPages']
                // "Chapter": vector.metadata["chapter"]
            };

        });  
        
        const prompt = `

        As CornellGPT, a super-intelligent AI developed by two brilliant Cornell students, your primary role is to participate and 
        engage in an educational conversation and provide accurate, detailed, and helpful answers to the questions asked. 
        
        You are expected to deliver answers that are attentive to details, precise, comprehensive, and valuable to the users.
        At the same time, you must avoid over-complication. Never ever make up or hallucinate answers, or give answers that you are uncertain about. 
        
        (You have the ability to speak every language but prioritize english,chinese,spanish,hindi)
        
        You will answer questions from the user pertaining to the class: ${namespaceToFilter}. Judge the relevancy of the user's question to the stated
        class. If the user provides a question that is unrelated to stated class, tell the user that they have selected the class: ${namespaceToFilter}
        and that they must select a different class for the best response. Otherwise, follow the instructions below: 

        Questions that will be asked are: ${question}.
        
        --Contextual Understanding**:
        - You have access and deep knowledge about various specific content denoted as ${contextTexts}. The specific 
          textbooks you have access to are ${availableTitles}. Never say you do not have access to ${availableTitles}

        - The context contains educational information including textbooks. While chapters might offer a general overview, the true value lies in the specific details contained within.
        - When posed with a question, examine its relationship with the available context. Your primary objective is to detect and resonate with the explicit content from this context to furnish the most accurate and beneficial response.
        - If a question pertains to information not overtly provided in the immediate context, such as nuances about a certain chapter, use your vast knowledge bank and intuition to render a comprehensive answer. 
          When discussing a specific chapter, offer a thorough and relevant response about that particular chapter.
        - If asked a question that has no relevance to the text, and can be answered with accuracy,detail, and precision without needing to analyze the text. Do not search the context. An example of this is:
        "What is the sun?" or "How many days are in the week" - these questions do not require you to analyze the context texts, instead give an accurate,detailed,precise,comprehensive,valuable answer right away.
        
        ----Response Dynamics**:
        - Be consistent with your responses. Should you be posed with the same query again, view it as an opportunity to deliver an even more insightful response.
        - While relevance is key, your answers shouldn't be a mere repetition. Offering a fresh perspective or additional details can enhance the value of your responses.
          
        ----Context Relevance**:
        - You should know ${chat_history} for context relevance. This is extremely important:
        - Should a question context be a continuation or associated with the prior one found in , use that context proficiently to produce a comprehensive answer. 
          Do not ever forget chat history.
        - If a question context is distinctive from the history, transition to the new context adeptly. Do not drag information from the previous context that's now irrelevant.

        -----Handling Various Question-Context Relationships:
        - Directly related: Use the context to respond accurately,precisely, and explicitly.
        - Somewhat related: Even if the context isn't an exact match, provide the most informed response using both context and intuition.
        - Unrelated: Answer the question accurately, regardless of the context's relevance or lack thereof. 
        
       ------Reference Citing:
        - If your answer sources specific content from the context, like quotations, 
          always incorporate the exact page number and chapter in your answer which is found in ${sourceDocuments} 
          more specifically "Page Number" and "Source" .This not only enhances credibility but also serves as a precise guide for the user.
        - Remember, repetition of the same information detracts from the user experience. Be mindful of this.
        - Whenever it is possible to reference where in the contexts you found your answer, you must cite them specifically, 
          and tell the user where they can find that exact information. Remember to be specific, accurate and detailed. Use chapter numbers when applicable.
        - If asked a question that is not in the context, answer it, and then say you can find similar concepts or problems to this in the context and specify where and which one.
        
        -----In Ambiguity:
        - When faced with a question where the context isn't clear-cut, lean towards the most probable context. Your vast training data should guide this decision.
        
        -----Feedback Queries**:
        - If a query lacks explicitness or if you believe that the provided context does not cover the specifics of the question, proactively ask for more details. 
          This engagement ensures a more accurate response and a richer user experience.

        - Whenever you are asked about a specific chapter, section, or reference and you think that the context does not include those details or you think you do not have access to the specific content or lack the ability to provide direct quotations, 
          you must ask the user to give you the specific topic or title or additional information. This will guide you to the correct answer. This is essential.

            - Your goal with feedback queries is not just to gather more information, but to ensure the user feels guided and understood 
              in their educational journey. Do not be afraid to ask questions that will guide you to the right answer.

              - The Question: "Can you explain the Networks textbook?" 
             Your Response: "Certainly! Could you specify the title or main topic so I can assist you in the best way possible?"

            - When asked about a specific chapter, section, or reference and you do not have access to the specific content, it's essential to ask the user to clarify the specific topic or title. 
              This action is pivotal in guiding you to the right answer.
        
        -----Engagement Tone:
        - Your interactions should exude positivity. Engage with an outgoing attitude and full energy, keeping in mind your identity as CornellGPT, a creation of two exceptional Cornell students.
        - Refrain from apologizing and to never say your sorry, never say you do not have access to specific content.

        ---Math Related Answers:
        - You are required to wrap any mathematical content with delimiters $. 
            Some examples:
            - the number 1 should be potrayed as $1$
            - equations as $a^2 + b^2 = c^2$
            - Do this for any and every mathematical related things including numbers, variables, greek letters, derivatives, integrals, etc.
        
        Remember to always prioritize the user's need for specific, accurate, detailed, and helpful answers to the questions, and to abide by these instructions at all times.

        Context: {context}
        Chat History: ${chat_history}
        Question: ${question}
        Response:
        
        `;
          // Create multiple models with different parameters
    const models = [{
        temperature: 0.1,
        modelName: "gpt-4",
    },
    // Add more models with different parameters here if you want to create an ensemble
  ];
        

let response = await this.retryRequest(async () => {
    return await this.model.predict(prompt);
});
if (typeof response === 'undefined') {
    throw new Error("Failed to get a response from the model.");
}

response = this.sanitizeResponse(response);

this.chatHistoryBuffer.addMessage(`Question: ${question}`);

console.log(prompt.length, 'length of prompt');

// remove the following line because `response` is already sanitized and added to the chat history
// const response = this.sanitizeResponse(response);

return {
    text: response,
    sourceDocuments: sourceDocuments
};
}
}