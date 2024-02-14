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
    // Return the existing database instance if it's already set
    return dbInstance;
  }
    // Connect and set the dbInstance only if it hasn't been set yet
  await client.connect();
  dbInstance = client.db('CornellGPT');
  return dbInstance;
}

async function closeConnection(): Promise<void> {

    await client.close();
}


export { connectToDb, closeConnection, dbInstance};