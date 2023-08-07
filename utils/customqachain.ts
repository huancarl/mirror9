import { OpenAIChat } from "langchain/llms";
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
    }

    public static fromLLM(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions): CustomQAChain {
      return new CustomQAChain(model, index, namespaces, options);
    }

    public async call({ question, chat_history }: { question: string; chat_history: string }) {
        // Create an instance of the OpenAIEmbeddings class.
        const embeddings = new OpenAIEmbeddings();
        const queryEmbedding = embeddings.embedQuery(question);

    // Perform a search across the specified namespaces ("book-1", "book-2", "book-3").
    const searchResults = await Promise.all(this.namespaces.map((namespace) => {
      return this.index.search({
        query: queryEmbedding,
        namespace,
      });
    }));

    // Parse and process the search results.
    const parsedResults = this.parseResults(searchResults);
    const processedResults = await this.processResults(parsedResults);

    // Format the results based on the specified options.
    const formattedResults = this.formatResults(processedResults);

    return formattedResults;
  }
  
// This probably wont even fucking work, and its okay tbh i dont think we even need it******

private parseResults(searchResults: any[]): any[] {
    // Flatten and merge all search results.
    return searchResults.flatMap((searchResult, index) => {
      // Include the book name in the parsed results.
      return searchResult.items.map((item: any) => ({
        ...item,
        book: NAMESPACE_NUMB[index + 1], // Assuming index corresponds to the book key
      }));
    });
  }
  
  private async processResults(parsedResults: any[]): Promise<any> {
    // You may process the parsed results here if needed. For example, if you need further analysis by the model, you can do that here.
    // In this example, we simply return the parsed results.
    return parsedResults; // Adjust as needed.
  }
  
  private formatResults(processedResults: any): any {
    if (this.options.returnSourceDocuments) {
      // Format the results to include chapter, page number, and source document (book).
      return processedResults.map((result: any) => ({
        chapter: result.chapter, // Assuming this field exists in the results
        pageNumber: result.pageNumber, // Assuming this field exists in the results
        sourceDocument: result.book, // Book name from the namespaces
      }));
    }
    return processedResults; // Adjust as needed.
  }  
}


