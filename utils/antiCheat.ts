import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { pinecone } from '@/utils/pinecone-client';

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

async function calculate_similarity_score(question: any, assignmentNamespaces: string[], index: any){

    // The function will retrieve from the assignment namespaces for a class and get the most similiar questions from those assignments 
    // It takes in an embedded question, the namespaces where the assignments are ingested in, and the pinecone index to search in

    let fetchedTexts: PineconeResultItem[] = [];
    let remainingDocs = 1;                      // max vector search, adjust accordingly till find optimal
    let similarity_score = 0; //init the score to 0

    const namespacesToSearch = assignmentNamespaces;
    const numOfVectorsPerNS = Math.floor(remainingDocs/1); 
    
    for (const namespace of namespacesToSearch) {
        const queryResult = await index.query({
            queryRequest: {
                vector: question,
                topK: numOfVectorsPerNS,
                namespace: namespace,
                includeMetadata: true,
            },
        });

        //Iterate through the query results and add them to fetched texts
        if (queryResult && Array.isArray(queryResult.matches)) {

            for (const match of queryResult.matches) {
                fetchedTexts.push(match);
                // if (match.score > similarity_score) {
                //     similarity_score = match.score;
                // }
                similarity_score += match.score;

            }
        } else {
            console.error('No results found or unexpected result structure.');
        }
    }
    console.log(similarity_score/remainingDocs, 'this is the similiartiy score');
    similarity_score = similarity_score/remainingDocs;
    return similarity_score;  
}

export async function anti_cheat(question: string, questionEmbed: any, namespace: string): Promise<boolean> {
    
    let cheat: boolean;

    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const score = await calculate_similarity_score(questionEmbed, ['INFO_1260_Assignments'], index);

    if(score > 0.89){
        cheat = true;
    }
    else{
        cheat = false;
    }
    return cheat;
}

