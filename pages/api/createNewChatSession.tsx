import connectToDb from '@/config/db';

const createNewSession = async (req, res) => {
    const { userID, sessionID, course, name} = req.body;
  
    if (!userID || !sessionID) {
      return res.status(400).json({ error: 'userID and sessionID are required' });
    }
  
    try {
      console.log('body for create new sess', req.body);
      const db = await connectToDb();
      const sessionCollection = db.collection('sessionIDs');
  
      const day = new Date();

      await sessionCollection.insertOne({
        userID,
        sessionID,
        name: name || "New chat",
        date: day,
        course: course,
        isEmpty: true,
      });
  
      return res.status(200).json({ success: true, date: day});
  
    } catch (error) {
      console.error('Failed to create new chat session:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default createNewSession;
