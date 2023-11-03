import connectToDb from '@/config/db';

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed'); // Handle other methods as needed
        return;
    }

    const { sapp } = req.body; // Assuming you're sending the sessionID under the name "sapp"

    if (!sapp) {
        res.status(400).send('Missing sessionID');
        return;
    }

    let db;

    try {
        db = await connectToDb();
        const sessionIDs = db.collection('sessionIDs');

        const document = await sessionIDs.findOne({ sessionID: sapp }); // Assuming the field in the database is named "sessionID"

        if (!document) {
            res.status(404).send('No document found for the provided sessionID');
            return;
        }

        if (document.course === undefined) {
            res.status(404).send('No course field found for the provided sessionID');
            return;
        }

        res.status(200).json({ course: document.course });
    } catch (error) {
        console.error('Error in API route:', error);
        res.status(500).send('Internal Server Error');
    } 
}
