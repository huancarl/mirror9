import connectToDb from '@/config/db';

export default async (req, res) => {
  const { userID, course } = req.body;

  if (!userID) {
    return res.status(400).json({ error: 'userID is required' });
  }

  try {
    const db = await connectToDb();
    const sessionsCollection = db.collection('sessionIDs'); 

    // Sort the results in descending order based on the date field
    const sessions = await sessionsCollection.find({ userID, course }).sort({ date: -1 }).toArray();

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({ sessions: false});
    }

    return res.status(200).json({ sessions });

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};