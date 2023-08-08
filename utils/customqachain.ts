import { OpenAIChat } from "langchain/llms/openai";
import axios from 'axios';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { NAMESPACE_NUMB } from "@/config/pinecone";
import { pinecone } from "@/utils/pinecone-client";
import { PINECONE_INDEX_NAME } from "@/config/pinecone";

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

    public async call({ question, chat_history }: { question: string; chat_history: string }) {
        const embeddings = new OpenAIEmbeddings();
        const queryEmbedding = await embeddings.embedQuery(question); // Ensure the embedding is resolved

        if (!queryEmbedding) {
            throw new Error("Failed to generate embedding for the question.");
        }

        const searchResults = await Promise.all(this.namespaces.map((namespace) => {
            return this.index.query({
                query: queryEmbedding, // Directly set query to the embedding, assuming Pinecone wants the array directly
                namespace,
            });
        }));

      }
}







