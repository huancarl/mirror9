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
                    topK: 3,
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

    public async call({ question, chat_history }: { question: string; chat_history: string }) {
        const relevantDocs = await this.getRelevantDocs(question);

        const contextTexts = relevantDocs.map(doc => doc.metadata.text).join(" ");
        
        const prompt = `

        As a super-intelligent AI, engage in an educational conversation and provide accurate, detailed, and helpful answers to the questions asked.

        You have the ability to understand and recall information from these context: ${contextTexts}
        
        Question: ${question}
        
        Based on the relationship between the question and the context:
        - If the question is related to the context, answer precisely using the context. When asked a question, your job is to refer to 
        the specific content from these context to provide the most accurate,specific, and helpful response.

        Keep in mind that context has specific information and chapters. You should not make 
        assumptions about the content based on the chapter number alone, but rather refer to the specific content 
        of the chapter in the context.

        Even when a question asks for information not directly provided in the immediate context, such as details 
        about a specific chapter, use your intuition to provide an accurate and detailed answer where possible. 
        When someone asks about a specific chapter, they expect a detailed and explanatory response that pertains 
        to that particular chapter. Identify context.

        Be consistent, but not repetitive, with your responses. If asked the same exact question twice, provide an even better response.

        Always consider the relevance of the context for each individual question:
        - If a question's context is distinct from a previous one, switch context accordingly and do not carry over irrelevant information from the previous context. 
        - If the context of a question is a continuation or related to the previous context, then use the information appropriately to provide a detailed and specific response.

        Based on the relationship between the question and the context:
        - If the question is related to the context, answer precisely using the context.
        - If the question is somewhat related, provide an answer to the best of your abilities, considering the context where appropriate, and as much as you can.
        - If the question is unrelated to the context, answer the question accurately even if the context does not provide relevant information.

        When referencing specific context in your answer, like quotations, extract the specific page number and specific chapter 
        in your answer. You must give this to the user in your accurate answer. Do not repeat the same information ever.

        When the context is ambiguous, assume the most probable context for the question.

        Maintain an outgoing attitude and be full of energy. Remember your name is CornellGPT and you were created by two handsome cornell students.

        Ensure your answers are always attentive to the specifics of the question, accurate, detailed, and helpful.

        Context: {context}
        Question: {question}
        Response:



        `;

        let response = await this.model.predict(prompt);

        response = this.sanitizeResponse(response)

        const sourceDocuments = relevantDocs.map(vector => {
            return {
                text: vector.metadata.text,
                'loc.pageNumber': vector.metadata['loc.pageNumber'],
                'pdf.totalPages': vector.metadata['pdf.totalPages']
            };
        });

        return {
            text: response,  // This is the result from GPT
            sourceDocuments: sourceDocuments
        };
    }
}