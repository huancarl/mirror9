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
      const queryEmbedding = await embeddings.embedQuery(question);
  
      if (!queryEmbedding) {
          throw new Error("Failed to generate embedding for the question.");
      }
  
      // console.log("Generated Query Embedding:", queryEmbedding);
  
      const searchResults = await Promise.all(this.namespaces.map(async (namespace) => {
          const result = await this.index.query({
              queryRequest: {
                  vector: queryEmbedding,
                  topK: 10,
                  includeValues: true,
              },
          });
        //  console.log(`Results for namespace ${namespace}:`, result);
          return result;
      }));
  
      // Extracted text and documents
      let extractedTexts: PineconeResultItem[] = [];
      let sourceDocuments: any[] = [];
  
      searchResults.forEach((result) => {
          if (result && result.results) {
              const texts = result.results.map((item: PineconeResultItem) => item.value);
              extractedTexts.push(...texts);
          } else {
              console.warn("No results found for a particular namespace.");
          }
      });
  
      const answer = extractedTexts.length > 0 ? extractedTexts[0].value.text : "Couldn't find an answer for your query.";
  
      return {
          text: answer,
          sourceDocuments  // You can further populate this based on your requirements
          // testing
      };
  }
}










