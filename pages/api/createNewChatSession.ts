import {connectToDb, dbInstance }from '@/config/db';

const createNewSession = async (req, res) => {
    const { userID, sessionID, course, name} = req.body;
  
    console.log(dbInstance, 'this is dbinstance');

    if (!userID || !sessionID) {
      return res.status(400).json({ error: 'userID and sessionID are required' });
    }
  
    try {
      
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
