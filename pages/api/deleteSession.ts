import {connectToDb} from '@/config/db';

const deleteSession = async (req, res) => {
    const { sessionID, className } = req.body;
  
    if (!sessionID) {
      return res.status(400).json({ error: 'SessionID is required' });
    }
  
    try {
      const db = await connectToDb();
      const sessionCollection = db.collection('sessionIDs');
      
      // Delete the document with the provided sessionID
      const deleteResult = await sessionCollection.deleteOne({ sessionID: sessionID, course: className});
      
      if (deleteResult.deletedCount === 1) {
        // If the document was successfully deleted
        return res.status(200).json({ success: true });
      } else {
        // If the document was not found
        return res.status(404).json({ error: 'Session not found' });
      }
  
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default deleteSession;