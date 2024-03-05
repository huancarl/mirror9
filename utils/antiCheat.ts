import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { Pinecone } from '@pinecone-database/pinecone';

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

async function calculate_material_similarity_score(question: any, assignmentNamespaces: string[], pc: any){

    // The function will retrieve from the all materials namespaces for a class and get the most similiar vector from said class.
    // The purpose of this function is to act as an extra guard by comparing the scores of the vectors from all materials namespace with
    // the assignment namespace ensuring that the question the user asked is more likely to be from the assignment then notes.
    // It takes in an embedded question, the namespaces where the all assignments are ingested in, and the pinecone index to search in

    let fetchedTexts: PineconeResultItem[] = [];
    let remainingDocs = 1;                      // max vector search, adjust accordingly till find optimal
    let similarity_score = 0; //init the score to 0

    const namespacesToSearch = assignmentNamespaces;
    const numOfVectorsPerNS = Math.floor(remainingDocs/1); 
    
    const namespaceQueries = namespacesToSearch.map(async namespace => {
        const currNamespace = pc.index(process.env.PINECONE_INDEX_NAME).namespace(namespace);
            return await currNamespace.query({
                topK: numOfVectorsPerNS,
                vector: question,
                includeMetadata: true,
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
    
    similarity_score = results[0].matches[0].score;  

    console.log(similarity_score, 'this is the similiartiy score for all materials');

    return similarity_score;  
}

async function calculate_similarity_score(question: any, assignmentNamespaces: string[], pc: any){

    // The function will retrieve from the assignment namespaces for a class and get the most similiar questions from those assignments 
    // It takes in an embedded question, the namespaces where the assignments are ingested in, and the pinecone index to search in

    let scoreAndVector = {};

    let fetchedTexts: any = [];
    let remainingDocs = 1;  // max vector search

    const namespacesToSearch = assignmentNamespaces;
    const numOfVectorsPerNS = remainingDocs;

    // Create an array of promises for each namespace query
    const namespaceQueries = namespacesToSearch.map(async namespace => {
        const currNamespace = pc.index(process.env.PINECONE_INDEX_NAME).namespace(namespace);
            return await currNamespace.query({
                topK: numOfVectorsPerNS,
                vector: question,
                includeMetadata: true,
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

    //Get the highest score
    const score = results[0].matches[0].score;  
    
    console.log(score, 'this is score');

    //We also want to return which assignment and which part of it we are assuming the user is asking about to
    //return to the prompt in assignmnetqachain
    
    let metadata = {};
    // const sourceName = results[0].matches.metadata.source;
    // const text = results[0].matches.metadata.text;
    // const pageStart = results[0].matches.metadata['loc.pageNumber'];
    // const pageNumbers = results[0].matches.metadata['pdf.totalPages']; 

    // metadata['source'] = sourceName;
    // metadata['text'] = text; 
    // metadata['pageStart'] = pageStart;
    // metadata['pageNumbers'] = pageNumbers;

    scoreAndVector['score'] = score; 
    scoreAndVector['metadata'] = metadata;

    return scoreAndVector;
}

export async function anti_cheat(question: string, questionEmbed: any, fullNamespace: string, classNamespace:string): Promise<object> {
    
    let cheat: boolean;
    let result = {};

    const pc = new Pinecone();


    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const materialsScore = await calculate_material_similarity_score(questionEmbed, [classNamespace], pc);

    const scoreAndMetadata = await calculate_similarity_score(questionEmbed, [fullNamespace], pc);
    const score = scoreAndMetadata['score'];
    const metadata = scoreAndMetadata['metadata'];

    if(score > 0.89 && score > materialsScore){
        cheat = true;
        result['cheatGuess'] = cheat;
        result['vector'] = metadata;
    }
    else{
        cheat = false;
        result['cheatGuess'] = cheat;
        result['vector'] = null;
    }

    return result;
}

