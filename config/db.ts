import { MongoClient, Db, ServerApiVersion } from 'mongodb';


const uri: string = "mongodb+srv://CgptUser:FY67GA6TjIW1xf4f@cornellgpt.52ar7ly.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
async function connectToDb(): Promise<Db> {
    try{
        await client.connect();
        return client.db('CornellGPT');
    }
    catch(e){
        console.log(e);
        throw e;
    }
}
export default connectToDb;