import connectToDb from '@/config/db';
import { OAuth2Client } from 'google-auth-library';
import { withSession } from 'utils/session'; // Adjust the import path as needed

const client = new OAuth2Client("143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com");

async function loginHandler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();

        if (payload) {
            const userEmail = payload.email;
            const db = await connectToDb();
            const allUsers = db.collection('verifiedUsers');

            const currUser = await allUsers.findOne({ userEmail });

            if (currUser) {
                // User is valid, set user email in session
                req.session.set('user', { email: userEmail });
                await req.session.save();

                res.status(200).json({ success: true, message: "User is valid.", email: userEmail });
            } else {
                // User does not have a valid subscription
                res.status(403).json({ success: false, message: "User is not valid.", email: '' });
            }
        } else {
            res.status(500).json({ success: false, error: 'User payload was empty', email: '' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Verification failed", email: '' });
    }
}

export default withSession(loginHandler);