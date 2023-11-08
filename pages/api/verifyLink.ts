import connectToDb from '@/config/db';

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const { link } = req.body;

    try {
        const db = await connectToDb();
        const referrals = db.collection('referrals');

        const document = await referrals.findOne(
            { 
                code: link,
                valid: true
            }
        );

        if (!document) {
            res.status(200).json({isValid: false});
            return;
        }
        res.status(200).json({ isValid: true });

    } catch (error) {
        console.error('Error in API route:', error);
        res.status(500).send('Internal Server Error');
    } 
}