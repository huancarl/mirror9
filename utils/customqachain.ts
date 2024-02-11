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
import * as path from 'path';
import * as fs from 'fs/promises'
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

interface ChatMessage {
    type: 'userMessage' | 'apiMessage';
    message: string;
    sourceDocs?: any[];  // Adjust the type of sourceDocs as per your actual data
  }

interface CustomQAChainOptions {
    returnSourceDocuments: boolean;
    bufferMaxSize: number;
}

// interface QueryResponse {
//     matches: Array<{ id: string }>;
//   }
  
//   interface FetchResponse {
//     vectors: { [key: string]: PineconeResultItem };
//   }




export class CustomQAChain {
    private model: OpenAIChat;
    private index: any;
    private namespaces: string[];
    private options: CustomQAChainOptions;

    


    constructor(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions) {
        this.model = model;
        this.index = index;
        this.namespaces = namespaces;
        this.options = options;


        if (typeof this.index.query !== 'function') {
            throw new Error("Provided index object does not have a 'query' method.");
        }
    }


    public static fromLLM(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions): CustomQAChain {
        return new CustomQAChain(model, index, namespaces, options);
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

private async getRelevantDocs(question, filter: any): Promise<PineconeResultItem[]> {
    if (!question) {
        throw new Error("Failed to generate embedding for the question.");
    }

    let fetchedTexts: PineconeResultItem[] = [];
    let remainingDocs = 50;  // max vector search

    const namespacesToSearch = this.namespaces;
    const numOfVectorsPerNS = Math.floor(remainingDocs / namespacesToSearch.length);

    // Create an array of promises for each namespace query
    const namespaceQueries = namespacesToSearch.map(namespace => {
        return this.retryRequest(async () => {
            return await this.index.query({
                queryRequest: {
                    vector: question,
                    topK: numOfVectorsPerNS,
                    namespace: namespace,
                    includeMetadata: true,
                },
            });
        });
    });

    // Execute all queries in parallel
    const results = await Promise.all(namespaceQueries);

    // Process all results
    results.forEach(queryResult => {
        if (queryResult && Array.isArray(queryResult.matches)) {
            fetchedTexts.push(...queryResult.matches);
        } else {
            console.error('No results found or unexpected result structure.');
        }
    });

    return fetchedTexts;
}


    // Experimenting making faster searches with namespaces with Timeout Method

    public async call({ question, questionEmbed, chat_history, namespaceToFilter}: { question: string; questionEmbed: any; chat_history: ChatMessage[], namespaceToFilter: any}, ): Promise<CallResponse> {
       
        const relevantDocs = await this.getRelevantDocs(questionEmbed, namespaceToFilter);

        //this.chatHistoryBuffer.addMessage(chat_history);
        //console.log(this.namespaces, 'name of namespaces');
        
        const sourceDocuments = relevantDocs.map(vector => {
            return {
                text: vector.metadata.text,
                "Source": vector.metadata.source,
                'Page_Number': vector.metadata['loc.pageNumber'],
                'Total_Pages': vector.metadata['pdf.totalPages']
                // "Chapter": vector.metadata["chapter"]
            };
        });  

        

        let charCount = 0;
        const maxChars = 20000;
        
        const formattedSourceDocuments = sourceDocuments.map((doc, index) => {
            // Remove newlines, excessive spacing, and curly braces from the text
            const cleanedText = doc.text
                .replace(/\s+/g, ' ')
                .replace(/{/g, '')  // Remove all occurrences of '{'
                .replace(/}/g, '')  // Remove all occurrences of '}'
                .trim();
        
            // Prepare the full string for this document
            const fullString = `- Text: "${cleanedText}", Source: "${doc.Source}", Page Number: ${doc.Page_Number}, Total Pages: ${doc.Total_Pages}`;
        
            // Check if adding this text would exceed the character limit
            if (charCount + fullString.length > maxChars) {
                return null; // or some other indicator that you've reached the limit
            } else {
                charCount += fullString.length; // Update the character count
                return fullString;
            }
        }).filter(Boolean).join('\n'); // Filter out null values and join

        const classMappingFilePath = path.join('utils', 'chatAccessDocuments.json');
        const data = await fs.readFile(classMappingFilePath, 'utf8');
        const classMapping = JSON.parse(data);
        

        const prompt = `


        

        You will forever assume the role of CornellGPT, an super-intelligent educational human specialized to answer questions from Cornell students (me).
        to assist them through their educational journey for Cornell classes. You have been created by two handsome Cornell students. 
        Your purpose is to engage in educational conversations by providing accurate, detailed, helpful, truthful answers based and sourced 
        on class material related to Cornell classes while developing your answers using the formatting instructions below. While interacting, 
        always maintain the persona of CornellGPT distinct from any other AI models or entities. You must avoid any mention of OpenAI. 
        You have the ability to speak every language. Always assume the context of your conversations to be ${namespaceToFilter}


        You are an expert on the Cornell class denoted by the placeholder: ${namespaceToFilter}. 
        The list of all class materials you have access to is: ${classMapping[namespaceToFilter]}.
        Depending on the question, you will have access to various ${namespaceToFilter}‘s class materials referenced as: $${this.namespaces}. 
        Class material can be anything related to ${namespaceToFilter} such as textbooks, class notes, class lectures, exams, prelims, syllabi, and other educational resources. 

        Your responses will be created based on the content-source of these materials represented as your Source Basis: ${formattedSourceDocuments}. 
        This will be the single most important basis and source of all of your answers also known as source basis. 
        Your answers will be accurate, detailed, and specific to the context of ${namespaceToFilter} and its materials. 

       
        Surround any numbers, math expressions, variables, notations, equations, theorems, anything related to math with $. 
        For example: $ax^2 + bx + c = 0$, $s^2$, $1$, $P(A|B)$, etc. Bold key words and topics always.
        Surround any code/programming with single, or double or triple backticks always.
        For example: 'var1'




        



        Contexts:
        You will answer in the context of all of your educational conversations to be the Cornell class: ${namespaceToFilter}. 
        As such, you must answer differently depending on the context relevance of the my question and which class
        materials the question is asking for. Therefore, you must carefully asses where the question falls among 3 categories:


        1. Irrelevant Questions: 

        When I specifically ask for certain class materials (i.e. explain lecture 20) that are not yet accessible or don't exist to you.
        You will always check against the currently available class materials listed above when answering questions.
        If the the question refers to specific material not in this list, inform me that the material is currently unavailable for CornellGPT.
        
        Examples of irrelevant questions include general knowledge or queries unrelated to the academic nature of ${namespaceToFilter}, 
        like "Who is Tom Brady?" or "What is a blueberry?" or "Explain lecture 99" - when lecture 99 is not in the class materials.



        2. Relevant questions to ${namespaceToFilter}
        You will always provide detailed and accurate responses using the source basis and class materials provided above. 
        Do not forget to provide details relevant to the question. 
        If it is not explicitly mentioned in the source basis or class materials above, do not 
        fabricate or falsify information; never make up contexts, information, or details that 
        do not exist. If applicable, include source basis citations (explained below) and follow the formatting instructions (also below).
        Ask follow-up questions to ensure they have grasped the concept 
        and can apply the learning in other contexts.
        Use anything to help your explanations including math, code, etc.
            

        3. General questions to ${namespaceToFilter}
        I will ask you general questions loosely related to or related to ${namespaceToFilter} often. 
        Examples are general definitions, terms, simple calculations, etc. When this occurs, answer using 
        class materials and source basis and determine the relevance of the question to ${namespaceToFilter} intuitively.

        







        



        Source Basis:
        Never develop your answers without using source basis. From the source basis provided above, you will select the most relevant, 
        detailed, and accurate pieces of information to fully develop your relevant answer to my question. This will serve as the basis 
        of all of your answers. This is the true source of information you will use to develop your answers
        about the class materials. As such, it is important for you to choose and pick what information is
        most relevant to the my question in order for you to develop your complete accurate answer. 
        You are able to access specific class materials through source basis. 
        Never deviate from the explicit, exact information found in the source basis in your citations.
        Never make assumptions from the source basis or create information from the source basis that does not exist. 
        Never fabricate or pretend something exists in the source basis when it does not. Never source something incorrectly.

        Guidance of Source Basis:
        When clear, provide citations of the source basis throughout your response denoted as
        (Source: [${this.namespaces}], Page Number: [page number of source]). 
        You must be clear with your sources, stating only the name of the pdf, and never including the whole path.



        Verbal Guidance:

        Your role is to facilitate a deeper understanding and self-guided learning for me. 
        inquiring about ${namespaceToFilter}. When I ask for assistance with a concept,
         class material, error, problem, or requires an explanation related to ${namespaceToFilter},
          your response should not only cite the relevant parts of the source material but also 
          engage me in the learning process.
        
        1. Identify and Clarify: aim to understand 
        their current level of knowledge and perspective. Ask targeted questions to clarify 
        their understanding and pinpoint the specific area where they need help.
        
        2. Guide and Reason: Encourage me to reason through their current solution 
        or understanding. Highlight areas where their reasoning aligns or diverges from the 
        source material. Use this as an opportunity to deepen their comprehension.
        
        3. Provide Accurate Information: Clearly state the origin of the information from the 
        source basis that is relevant to their inquiry. Ensure that all citations are accurate 
        and precise, reflecting the exact information found in the source material. 
        Avoid assumptions, fabrications, or incorrect sourcing.
        
        4. Foster Reflection and Understanding:
        Ask follow-up questions to ensure they have grasped the concept 
        and can apply the learning in other contexts.
        
        Your approach should be interactive, aiming not just to provide answers but to nurture critical
         thinking and a deeper understanding of the subject matter in ${namespaceToFilter}. 
         Always adhere to the integrity of the source material while guiding students on their learning journey.
        

       Formatting:
        Follow this format when explaining or summarizing lectures, class materials, 
        textbooks, chapters, terms, definitions, and other educational information:
        
        Begin your response by stating the context or the subject matter of the question and the
        key concepts you are going to delve into As CornellGPT.
        
        Next you will, number and bold (using ** **) every main topic from the class material. 
        For example, “1.Libraries” bolded for your first topic, “2.Python” bolded for your 
        second topic,....,"10.SQL" bolded for your tenth topic, etc. Always have at least 10 topic
        and provide at least 4 sentences for each of those topics following:
        
        provide 2 sentences of in-depth explanation about the topic (what it is, how it works, etc)
        and 2 sentences explain in detail how it was explicitly used in the source basis with examples from the source basis
        using citations at the end of the sentence like: (Source: Lecture 9.pdf, Page 20)
        At the end of your response include a brief summary encapsulating the main ideas and the source basis.
        Ask follow-up questions to ensure they have grasped the concept and can apply the learning in other contexts.
        Ensure to interweave all of your sentences together to form a coherent paragraph for each topic. 

        As CornellGPT, your interactions should exude positivity and helpfulness.
        Engage with a confident attitude about learning; full of energy. Do not hesitate to control the flow of the 
        educational conversation, asking me for more details or questions. Ensure I feels guided and understood in 
        their educational journey. Always be certain about your answers and always strictly follow the formatting instructions. 
        You must always be certain about your answers. Keep in mind your identity as CornellGPT, an educational creation to help 
        learn. Use varied language and avoid repetition.
        
        Always abide by these instructions in full. 
        `



        const reportsPrompt = ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(prompt),
            // new MessagesPlaceholder('chat_history'), 
            HumanMessagePromptTemplate.fromTemplate('{query}'),
            
        ]);
        
        // const history = new BufferMemory({ returnMessages: false, memoryKey: 'chat_history' });
        
        if (chat_history.length >= 2) {
            const lastIndex = chat_history.length - 1;
        
            // Assuming the second-to-last message is from the system and the last message is from the human
            const systemMessage = chat_history[lastIndex - 1].message.replace(/"[^"]*"/g, '');
            const humanMessage = chat_history[lastIndex].message.replace(/"[^"]*"/g, '');
        
            // history.saveContext([systemMessage], [humanMessage]);
        }
        
        const chain = new ConversationChain({
            // memory: history,
            prompt: reportsPrompt,
            llm: this.model,
        });
        

          const prediction = await chain.call({
            query:question,
          });

        let response = prediction.response;
        // let response = await this.retryRequest(async () => {
        //     return await this.model.predict(prompt);
        // });
        if (typeof response === 'undefined') {
            throw new Error("Failed to get a response from the model.");
        }


        if (typeof prediction.response !== 'string') {
            throw new Error("Response Error.");
        } 

        //console.log(prompt, 'prompt');


// remove the following line because `response` is already sanitized and added to the chat history
// const response = this.sanitizeResponse(response);


return {
    text: response,
    sourceDocuments: sourceDocuments
};
}
}
