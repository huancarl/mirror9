import connectToDb from '@/config/db';

export default async (req, res) => {
  const { userID } = req.body;

  if (!userID) {
    return res.status(400).json({ error: 'userID is required' });
  }

  try {
    const db = await connectToDb();
    const sessionsCollection = db.collection('sessionIDs'); // Assuming your collection's name is "sessionIDs"

    // Fetch all sessions for the given userID
    const sessions = await sessionsCollection.find({ userID }).toArray();

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({ sessions: [] });
    }

    return res.status(200).json({ sessions });

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};