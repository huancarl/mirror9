import { MongoClient, Db, ServerApiVersion } from 'mongodb';


const uri: string = "mongodb+srv://CgptUser:FY67GA6TjIW1xf4f@cornellgpt.52ar7ly.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

let dbInstance: Db | null = null;

async function connectToDb(): Promise<Db> {
    if (dbInstance) {

      return dbInstance;
    }

    try{
      await client.connect();
      dbInstance= client.db('CornellGPT');
      return dbInstance;
    }
    catch(e){
        console.log(e);
        throw e;
    }
}

async function closeConnection(): Promise<void> {

    await client.close();
}


export { connectToDb, closeConnection, dbInstance};