import connectToDb from '@/config/db';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client("143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com");

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }
    try{
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();

        if(payload){
            const userEmail = payload.email;
            // const userSub = payload.sub; user unique identifier
            const db = await connectToDb();
            const allUsers = db.collection('verifiedUsers');

            const currUser = await allUsers.findOne({ userEmail: userEmail });

            if (currUser) {
                // User has a valid subscription
                res.status(200).json({ success: true, message: "User is valid." });
            } else {
                // User does not have a valid subscription
                res.status(403).json({ success: false, message: "User is not valid." });
            } 
        }
        else{
            res.status(500).json({success: false, error: 'User payload was empty'});
        }        
    }
    catch(error){
        res.status(500).json({ success: false, error: "Verification failed" });
    }


    

}