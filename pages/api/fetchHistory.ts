import connectToDb from '@/config/db';

export default async (req, res) => {
  const { userID, sessionID } = req.body;

  console.log(req.body);

  if (!userID || !sessionID) {
    return res.status(400).json({ error: 'userID and sessionID are required' });
  }

  try {
    const db = await connectToDb();
    const chatHistoryCollection = db.collection('chatHistories');
    
    // If you're storing each message individually
    const messages = await chatHistoryCollection.find({ userID, sessionID }).toArray();


   if(!messages || messages.length === 0) {
      return res.status(200).json({ messages: [] });
   }
    

    return res.status(200).json({ messages });

  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};