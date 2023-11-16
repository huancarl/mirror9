import connectToDb from '@/config/db';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client("143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com");

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    try{
        const { token, referral } = req.body;
        const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();

        if(payload){
            const db = await connectToDb();
            const userEmail = payload.email;

            //check if user is already valid
            const referrals = db.collection('referrals');
            const userCollection = db.collection('verifiedUsers');

            const checkIfUserExistsAlready = await referrals.findOne({ userEmail});

            if(!checkIfUserExistsAlready){
                //if user is not 
                await userCollection.insertOne({
                    userEmail: userEmail,
                    messagesLeft: 10,
                    paid: false,
                    dateCreated: new Date(),
                });

                //make referral obsolete 
                await referrals.updateOne(
                    {code: referral},
                    {$set: {valid: false}}
                )

                return res.status(200).json({ created: true, message: 'Success'});
            }
            else{
                return res.status(200).json({ created: false, message:'Email already in use'});
            }
        }
        else{
            return res.status(200).json({ created: false, message:'Error with email'});
        }
    } catch(e) {
        return res.status(500).json({ error: 'Failed to create an account' });
    }
}