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
    public async call({ question, chat_history }: { question: string; chat_history: string }) {
        const embeddings = new OpenAIEmbeddings();
        const queryEmbedding = await embeddings.embedQuery(question);
    
        if (!queryEmbedding) {
            throw new Error("Failed to generate embedding for the question.");
        }
    
        let fetchedTexts: PineconeResultItem[] = [];
    
        // Iterate over all namespaces to query and then fetch results
        for (const namespace of this.namespaces) {
            // Query Pinecone to get the IDs of the most similar vectors
            const queryResult = await this.index.query({
                queryRequest: {
                    vector: queryEmbedding,
                    topK: 10,
                    namespace: namespace
                },
            });
    
            // Extract IDs from the query result using queryResult.matches
            let ids: string[] = [];
            if (queryResult && Array.isArray(queryResult.matches)) {
                ids = queryResult.matches.map((match: { id: string }) => match.id);
            } else {
                console.error('No results found or unexpected result structure.');
            }
    
            if (ids.length > 0) {
                // Fetch the actual vectors or their associated data using the IDs
                const fetchResponse = await this.index.fetch({
                    ids: ids,
                    namespace: namespace
                });
    
                // Convert the vectors object values into an array and push them to fetchedTexts
                const vectorsArray: PineconeResultItem[] = Object.values(fetchResponse.vectors) as PineconeResultItem[];
                fetchedTexts.push(...vectorsArray);
            }
        }
    
        const sourceDocuments = fetchedTexts.map(vector => {
            return {
                text: vector.metadata.text,  // assuming the text field exists in the metadata
                'loc.pageNumber': vector.metadata['loc.pageNumber'],
                'pdf.totalPages': vector.metadata['pdf.totalPages']
            };
        });
    
        // Extract the text for the answer from the first item's metadata (if available)
        const answer = fetchedTexts.length > 0 && fetchedTexts[0].metadata.text ? fetchedTexts[0].metadata.text : "Couldn't find an answer for your query.";
        
        console.log(answer.length)

        return {
            text: answer,
            sourceDocuments: sourceDocuments
        };
    }

    // public async call({ question, chat_history }: { question: string; chat_history: string }) {
    //     const embeddings = new OpenAIEmbeddings();
    //     const queryEmbedding = await embeddings.embedQuery(question);
    
    //     if (!queryEmbedding) {
    //         throw new Error("Failed to generate embedding for the question.");
    //     }
    
    //     let fetchedTexts: PineconeResultItem[] = [];
    
    //     // Iterate over all namespaces to query and then fetch results
    //     for (const namespace of this.namespaces) {
    //         // Query Pinecone to get the IDs of the most similar vectors
    //         const queryResult = await this.index.query({
    //             queryRequest: {
    //                 vector: queryEmbedding,
    //                 topK: 10,
    //                 namespace: namespace  // specifying the namespace here
    //             },
    //         });
            
    //         // Extract IDs from the query result
    //         const ids: string[] = queryResult?.results?.map((item: { id: any; }) => item.id) || [];
    //         console.log(queryResult)
    //         console.log(ids, 'ids')
    //         console.log(namespace, 'namespace')

    //         if (ids.length > 0) {
    //             // Fetch the actual vectors or their associated data using the IDs
    //             const fetchResponse = await this.index.fetch({
    //                 ids: ids,
    //                 namespace: namespace  // specifying the namespace here
    //             });
    
    //             // Assuming the fetchResponse returns the vectors in a structured manner similar to query results
    //             const texts = fetchResponse.vectors.map((item: PineconeResultItem) => item.value);
    //             fetchedTexts.push(...texts);
    //         }
    //     }
    
    //     // At this point, `fetchedTexts` should contain the fetched data from Pinecone
    //     const answer = fetchedTexts.length > 0 ? fetchedTexts[0].text : "Couldn't find an answer for your query.";
    
    //     return {
    //         text: answer,
    //         sourceDocuments: fetchedTexts
    //     };
    // }
}

// import { OpenAIChat } from "langchain/llms/openai";
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
// import { NAMESPACE_NUMB } from "@/config/pinecone";
// import { PINECONE_INDEX_NAME } from "@/config/pinecone";
// import { makeChain } from "@/utils/makechain";

// interface CustomQAChainOptions {
//     returnSourceDocuments: boolean;
// }

// interface PineconeResultItem {
//     value: {
//         text: string;
//         source: string;
//         pageNumber: number;
//         totalPages: number;
//         book: string;
//     };
// }

// export class CustomQAChain {
//     private index: any;
//     private namespaces: string[];

//     constructor(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions) {
//         this.index = index;
//         this.namespaces = namespaces;

//         if (typeof this.index.query !== 'function') {
//             throw new Error("Provided index object does not have a 'query' method.");
//         }
//     }

//     public static fromLLM(model: OpenAIChat, index: any, namespaces: string[], options: CustomQAChainOptions): CustomQAChain {
//         return new CustomQAChain(model, index, namespaces, options);
//     }

//     public async call({ question, chat_history }: { question: string; chat_history: string }) {
//       const embeddings = new OpenAIEmbeddings();
//       const queryEmbedding = await embeddings.embedQuery(question);
  
//       if (!queryEmbedding) {
//           throw new Error("Failed to generate embedding for the question.");
//       }
  
//       // console.log("Generated Query Embedding:", queryEmbedding);
  
//       const searchResults = await Promise.all(this.namespaces.map(async (namespace) => {
//           const result = await this.index.query({
//               queryRequest: {
//                   vector: queryEmbedding,
//                   topK: 10,
//                   includeValues: true,
//               },
//           });
//         //  console.log(`Results for namespace ${namespace}:`, result);
//           return result;
//       }));
  
//       // Extracted text and documents
//       let extractedTexts: PineconeResultItem[] = [];
//       let sourceDocuments: any[] = [];
  
//       searchResults.forEach((result) => {
//           if (result && result.results) {
//               const texts = result.results.map((item: PineconeResultItem) => item.value);
//               extractedTexts.push(...texts);
//           } else {
//               console.warn("No results found for a particular namespace.");
//           }
//       });
  
//       const answer = extractedTexts.length > 0 ? extractedTexts[0].value.text : "Couldn't find an answer for your query.";
  
//       return {
//           text: answer,
//           sourceDocuments // You can further populate this based on your requirements
//           // testing
//       };
//   }
// }