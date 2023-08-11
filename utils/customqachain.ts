import { OpenAIChat } from "langchain/llms/openai";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { NAMESPACE_NUMB } from "@/config/pinecone";
import { PINECONE_INDEX_NAME } from "@/config/pinecone";

interface CustomQAChainOptions {
    returnSourceDocuments: boolean;
}

interface PineconeResultItem {
    value: {
        text: string;
        source: string;
        pageNumber: number;
        totalPages: number;
        book: string;
    };
}

export class CustomQAChain {
    private index: any;
    private namespaces: string[];

    constructor(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions) {
        this.index = index;
        this.namespaces = namespaces;

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

        console.log(queryEmbedding);
        if (!queryEmbedding) {
            throw new Error("Failed to generate embedding for the question.");
        }

        const searchResults = await Promise.all(this.namespaces.map(async (namespace) => {
          console.log('runs');

          try {
              const result = await this.index.query({
                  queryRequest: {
                      vector: queryEmbedding,
                      topK: 3,
                      includeValues: true,
                  },
                  namespace: 'cornellgpt', // ensure you meant to hard-code this or replace with `namespace`
              });
              console.log(`Query Result for ${namespace}:`, result);
              return result;
              
          } catch (error) {
              console.error(`Error querying namespace ${namespace}:`, error);
              throw error; // or return an error message to be handled later
          }
        }));

        return searchResults; // You may want to further process these results before returning
      }
}










