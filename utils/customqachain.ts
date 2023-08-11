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
      const queryEmbedding = await embeddings.embedQuery(question); 
  
      if (!queryEmbedding) {
          throw new Error("Failed to generate embedding for the question.");
      }
  
      // Define an array to hold our consolidated results and documents
      const consolidatedResults: { result: any, documents: any[] }[] = [];
  
      await Promise.all(this.namespaces.map(async (namespace) => {
          try {
              const result = await this.index.query({
                  queryRequest: {
                      vector: queryEmbedding,
                      topK: 3,
                      includeValues: true,
                  },
                  namespace: 'cornellgpt', // Make sure you change this to dynamic if required
              });
              console.log(result, 'result part 1')
              console.log(result.values, 'results')

              if (this.options.returnSourceDocuments) {
                  // Extract documents and their metadata from the result
                  const documents = result.values.map((value: any) => {
                      // You'll need to structure this based on the exact shape of the result's values
                      return {
                          content: value.text,  // Assuming 'text' holds the document content
                          metadata: value.metadata
                      };
                  });
  
                  consolidatedResults.push({
                      result: result,
                      documents: documents
                  });
              } else {
                  consolidatedResults.push({
                      result: result,
                      documents: []
                  });
              }
              
          } catch (error) {
              console.error(`Error querying namespace ${namespace}:`, error);
              throw error; 
          }
      }));
  
      return consolidatedResults;
  }

    // public async call({ question, chat_history }: { question: string; chat_history: string }) {
    //     const embeddings = new OpenAIEmbeddings();
    //     const queryEmbedding = await embeddings.embedQuery(question); // Ensure the embedding is resolved

    //     console.log(queryEmbedding);
    //     if (!queryEmbedding) {
    //         throw new Error("Failed to generate embedding for the question.");
    //     }

    //     const searchResults = await Promise.all(this.namespaces.map(async (namespace) => {
    //       console.log('runs');

    //       try {
    //           const result = await this.index.query({
    //               queryRequest: {
    //                   vector: queryEmbedding,
    //                   topK: 3,
    //                   includeValues: true,
    //               },
    //               namespace: 'cornellgpt', // ensure you meant to hard-code this or replace with `namespace`
    //           });
    //           console.log(`Query Result for ${namespace}:`, result);
    //           return result;
              
    //       } catch (error) {
    //           console.error(`Error querying namespace ${namespace}:`, error);
    //           throw error; // or return an error message to be handled later
    //       }
    //     }));

    //     return searchResults; // You may want to further process these results before returning
    //   }
}









