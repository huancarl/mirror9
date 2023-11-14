import connectToDb from '@/config/db';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client("681102915387-hs5ku9f7r3gocb1kqb01kpqi6j960ej4.apps.googleusercontent.com");

export default async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }
    try{
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "681102915387-hs5ku9f7r3gocb1kqb01kpqi6j960ej4.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();

        if(payload){
            const userEmail = payload.email;
            // const userSub = payload.sub; user unique identifier
            const db = await connectToDb();
            const allUsers = db.collection('verifiedUsers');

            const currUser = await allUsers.findOne({ email: userEmail });

            if (currUser) {
                // User has a valid subscription
                res.status(200).json({ success: true, message: "User is valid and has subscription." });
            } else {
                // User does not have a valid subscription
                res.status(403).json({ success: false, message: "User does not have a valid subscription." });
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