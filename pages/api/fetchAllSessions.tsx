import connectToDb from '@/config/db';

const fetchSessions = async (req, res) => {
  const { userID, course } = req.body;

  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  if (!userID) {
    return res.status(400).json({ error: 'userID is required' });
  }

  try {
    const db = await connectToDb();
    const sessionsCollection = db.collection('sessionIDs'); 

    // Sort the results in descending order based on the date field
    const sessions = sessionsCollection.find({ userID, course })

    if (!sessions) {
      return res.status(200).json({ sessions: false});
    }
  
    const sortedSessions = sessions.sort({ date: -1 }).toArray();

    if((await sortedSessions).length === 0){
      return res.status(200).json({ sessions: false });
    }
    return res.status(200).json({ sessions: await sortedSessions });

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default fetchSessions;
