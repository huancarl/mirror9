import connectToDb from '@/config/db';

export default async (req, res) => {
  const { userID, sessionID, course } = req.body;

  if (!userID || !sessionID) {
    return res.status(400).json({ error: 'userID and sessionID are required' });
  }

  try {
    const db = await connectToDb();
    const sessionCollection = db.collection('sessionIDs');

    const session = await sessionCollection.findOne({
      userID,
      isEmpty: true,
      course,
    });

    if (session) {
      // If a session with isEmpty: true exists, return its sessionID
      return res.status(200).json({ exists: true, sessionID: session.sessionID });
    } else {
      // If no such session exists, return exists: false
      return res.status(200).json({ exists: false });
    }

  } catch (error) {
    console.error('Failed to check session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};