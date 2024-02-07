import {connectToDb} from '@/config/db';

export default async function giveSubscriptionHandler(req, res) {
    try {
        const { userEmail } = req.body;

        const db = await connectToDb();
        const userCollection = db.collection('verifiedUsers');
        await userCollection.updateOne({userEmail: userEmail}, { $set: {paid: false, subscriptionEndDt: null,} });

        res.status(200).json({
            success: true,
        });

    } catch (error) {
        console.error('Error in createSubscriptionHandler:', error);
        res.status(500).send({ error: 'Error with creating sub' });
    }
}