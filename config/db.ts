import { MongoClient, Db, ServerApiVersion } from 'mongodb';


const uri: string = "mongodb+srv://MithGPT:mithy@cluster0.xzfeiws.mongodb.net/?retryWrites=true&w=majority";
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
        console.log('connection to mongodb successful');
        return client.db('cornellgptDB');
    }
    catch(e){
        console.log(e);
        throw e;
    }
}
export default connectToDb;
