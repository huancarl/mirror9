import {connectToDb} from '@/config/db';

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const { course, userID} = req.body;

    if (!course) {
        res.status(400).send('Missing course title');
        return;
    }

    let db;

    try {
        db = await connectToDb();
        const sessionIDs = db.collection('sessionIDs');

        // Assuming there's a 'createdAt' or 'updatedAt' field in your documents
        const document = await sessionIDs.findOne(
            { course, userID }, 
            { sort: { date: -1 } }
        );

        if (!document) {
            res.status(404).send('No document found for the provided course title');
            return;
        }

        res.status(200).json({ sessionID: document.sessionID });
    } catch (error) {
        console.error('Error in API route:', error);
        res.status(500).send('Internal Server Error');
    } 
}