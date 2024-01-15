import connectToDb from '@/config/db';

export default async function giveSubscriptionHandler(req, res) {
    try {
        const { userEmail, billingDate, customerID, subID } = req.body;

        const db = await connectToDb();
        const userCollection = db.collection('verifiedUsers');
        await userCollection.updateOne({userEmail: userEmail}, { $set: {paid: true} });

        await userCollection.updateOne({userEmail: userEmail}, { $set: {subscriptionEndDt: billingDate, stripeSubID: subID} });

        res.status(200).json({
            success: true,
        });

    } catch (error) {
        console.error('Error in createSubscriptionHandler:', error);
        res.status(500).send({ error: 'Error with creating sub' });
    }
}