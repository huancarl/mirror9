//     // private async history_relevance(question: string, chat_history: string): Promise<'relevant' | 'distinct'> {
//     //     const embeddings = new OpenAIEmbeddings();
        
//     //     const questionEmbedding = await embeddings.embedQuery(question);
    
//     //     // Check for chat_history content before embedding
//     //     let historyEmbedding;
//     //     if (typeof chat_history === 'string' && chat_history.trim()) {
//     //         historyEmbedding = await embeddings.embedQuery(chat_history);
//     //     } else {
//     //         return 'distinct';  // Return distinct directly if chat history is not a string or is empty
//     //     }
//     //     // Calculate cosine similarity between the two embeddings
//     //     const similarity = this.calculateCosineSimilarity(questionEmbedding, historyEmbedding);
    
//     //     // If similarity is above a certain threshold, consider them related
//     //     const threshold = 0.85;  // This threshold can be fine-tuned based on your needs
//     //     if (similarity > threshold) {
//     //         return 'relevant';
//     //     } else {
//     //         return 'distinct';
//     //     }
//     // }
    
//     // private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
//     //     const dotProduct = vecA.reduce((sum, a, index) => sum + a * vecB[index], 0);
//     //     const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
//     //     const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
//     //     return dotProduct / (magA * magB);
//     // }
    

//     public async call({ question, chat_history = ''}: { question: string; chat_history?: string }) {
//         const relevantDocs = await this.getRelevantDocs(question);
    
//         const contextTexts = relevantDocs.map(doc => doc.metadata.text).join(" ");
    
//         const availableTitles = `Networks, Probability Cheatsheet v2.0 , Harvard: Math 21a Review Sheet`;
    
//         const sourceDocuments = relevantDocs.map(vector => {
//             return {
//                 text: vector.metadata.text,
//                 "Source": vector.metadata.source,
//                 'Page Number': vector.metadata['loc.pageNumber'],
//                 'Total Pages': vector.metadata['pdf.totalPages']
//                 // "Chapter": vector.metadata["chapter"]
//             };
//         });
    
//         // const relevance = await this.history_relevance(question, chat_history);
//         // let relevanceInstruction = '';
//         // if (relevance === 'relevant') {
//         //     // Handle the case where the question is related to the chat history
//         //     relevanceInstruction = `
//         //     Given the chat history, the context of the current question appears to be relevant. 
//         //     Ensure that your response aligns with the preceding conversation.`
//         //     ;
//         // } else {
//         //     // Handle the case where the question is distinct from the chat history
//         //     relevanceInstruction = `
//         //     Given the chat history, the context of the current question appears to be distinct. 
//         //     You should transition adeptly to this new context without dragging information 
//         //     from the previous conversation that's now irrelevant.`
//         //     ;
//         // }    

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAIChat } from "langchain/llms/openai";

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

interface CustomQAChainOptions {
    returnSourceDocuments: boolean;
}

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

    private sanitizeResponse(input: string): string {
        // Split the string by '+' sign and trim whitespaces
        const parts = input.split('+').map(part => part.trim());
        
        // Join the parts and remove unwanted characters like quotation marks
        const sanitized = parts.join('').replace(/['"`]/g, '');
        
        return sanitized;
    }

    private async getRelevantDocs(question: string): Promise<PineconeResultItem[]> {
        const embeddings = new OpenAIEmbeddings();
        const queryEmbedding = await embeddings.embedQuery(question);

        if (!queryEmbedding) {
            throw new Error("Failed to generate embedding for the question.");
        }

        let fetchedTexts: PineconeResultItem[] = [];

        for (const namespace of this.namespaces) {
            const queryResult = await this.index.query({
                queryRequest: {
                    vector: queryEmbedding,
                    topK: 5,
                    namespace: namespace,
                    includeMetadata: true,
                },
            });

            let ids: string[] = [];
            if (queryResult && Array.isArray(queryResult.matches)) {
                ids = queryResult.matches.map((match: { id: string }) => match.id);
            } else {
                console.error('No results found or unexpected result structure.');
            }

            if (ids.length > 0) {
                const fetchResponse = await this.index.fetch({
                    ids: ids,
                    namespace: namespace
                });
                const vectorsArray: PineconeResultItem[] = Object.values(fetchResponse.vectors) as PineconeResultItem[];
                fetchedTexts.push(...vectorsArray);
            }
        }

        return fetchedTexts;
    }

    public async call({ question, chat_history }: { question: string; chat_history?: string }) {
        const relevantDocs = await this.getRelevantDocs(question);

        const contextTexts = relevantDocs.map(doc => doc.metadata.text).join(" ");
        console.log(relevantDocs, 'this is relevantDocs');
        console.log(relevantDocs.length, 'is the length of relevantDocs');
        console.log(contextTexts, 'is context texts');

        const availableTitles = `Networks, Probability Cheatsheet v2.0 , Harvard: Math 21a Review Sheet`;

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
        At the same time, you must avoid overcomplication. Never ever make up or hallucinate answers, or give answers that you are uncertain about. 

        Questions that will be asked are: ${question}.
        
        --Contextual Understanding**:
        - You have access and deep knowledge about various specific content denoted as ${contextTexts}. The specific 
          textbooks you have access to are ${availableTitles}

        - The context contains chapters and specific content. While chapters might offer a general overview, the true value lies in the specific details contained within.
        - When posed with a question, examine its relationship with the available context. Your primary objective is to detect and resonate with the explicit content from this context to furnish the most accurate and beneficial response.
        - If a question pertains to information not overtly provided in the immediate context, such as nuances about a certain chapter, use your vast knowledge bank and intuition to render a comprehensive answer. 
          When discussing a specific chapter, offer a thorough and relevant response about that particular chapter.
        - If asked a question that has no relevance to the text, and can be answered with accuracy,detail, and precision without needing to analyze the text. Do not search the context. An example of this is:
        "What is the sun?" or "How many days are in the week" - these questions do not require you to analyze the context texts, instead give an accurate,detailed,precise,comprehensive,valuable answer right away.
        
        ----Response Dynamics**:
        - Be consistent with your responses. Should you be posed with the same query again, view it as an opportunity to deliver an even more insightful response.
        - While relevance is key, your answers shouldn't be a mere repetition. Offering a fresh perspective or additional details can enhance the value of your responses.
          
        ----Context Relevance**:
        - You console ${chat_history} for context relevance. This is extremely important:
        - If a question context is distinctive from the history, transition to the new context adeptly. Do not drag information from the previous context that's now irrelevant.
        - Should a question context be a continuation or associated with the prior one found in , use that context proficiently to produce a comprehensive answer. 
        Do not ever forget chat history.

          
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
          and tell the user where they can find that exact information. Remember to be specific, accurate and detailed.
        
        -----In Ambiguity:
        - When faced with a question where the context isn't clear-cut, lean towards the most probable context. Your vast training data should guide this decision.
        
        -----Feedback Queries**:
        - If a query lacks explicitness or if you believe that the provided context does not cover the specifics of the question, proactively ask for more details. 
          This engagement ensures a more accurate response and a richer user experience.

        - Examples of Feedback Queries include:
            - Whenever you are asked about a specific chapter, section, or reference and you think that the context does not include those details or you think you do not have access to the specific content or lack the ability to provide direct quotations, 
            You must ask the user to give you the specific topic or title. This will guide you to the correct answer. This is essential.

            - Your goal with feedback queries is not just to gather more information, but to ensure the user feels guided and understood 
              in their educational journey. Do not be afraid to ask questions that will guide you to the right answer.

              - Query: "Can you explain Chapter 10 in the Networks textbook?" 
              Response: "Certainly! Could you specify the title or main topic of Chapter 10 so I can assist you in the best way possible?"

            - When asked about a specific chapter, section, or reference and you do not have access to the specific content, it's essential to ask the user to clarify the specific topic or title. 
              This action is pivotal in guiding you to the right answer.
        
        -----Engagement Tone:
        - Your interactions should exude positivity. Engage with an outgoing attitude and full energy, keeping in mind your identity as CornellGPT, a creation of two exceptional Cornell students.
        - Never apologize and never say your sorry, never say you do not have access to specific content. This is very important.
        
        Remember to always prioritize the user's need for specific, accurate, detailed, and helpful answers.
        
        Context: {context}
        Question: ${question}
        Response:
        
        `;
          // Create multiple models with different parameters
    const models = [{
        temperature: 0.2,
        modelName: "gpt-4",
    },
    // Add more models with different parameters here if you want to create an ensemble
  ];
        

        let response = await this.model.predict(prompt);

        response = this.sanitizeResponse(response)

        console.log(prompt.length, 'length of prompt')

        return {
            text: response,  // This is the result from GPT
            sourceDocuments: sourceDocuments
        };
    }
}