import connectToDb from '@/config/db';
import { OAuth2Client } from 'google-auth-library';
import { withSession } from 'utils/session'; // Adjust the import path as needed

const client = new OAuth2Client("143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com");

async function addNewUserHandler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    try {
        const { token, link } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();

        if (payload && payload.email) {
            const userEmail = payload.email;

            // Check if the email is a Cornell email
            if (!userEmail.endsWith('@cornell.edu')) {
                return res.status(400).json({ created: false, message: 'You must use your Cornell email (@cornell.edu)' });
            }

            const db = await connectToDb();

            // Check if user is already registered
            const userCollection = db.collection('verifiedUsers');
            const checkIfUserExistsAlready = await userCollection.findOne({ userEmail });

            if (!checkIfUserExistsAlready) {
                // If user is not registered, insert a new document
                await userCollection.insertOne({
                    userEmail: userEmail,
                    messagesLeft: 10,
                    paid: false,
                    dateCreated: new Date(),
                });

                // Make the referral link obsolete
                const referrals = db.collection('referrals');
                await referrals.updateOne(
                    { code: link },
                    { $set: { valid: false } }
                );

                req.session.set('user', { email: userEmail });
                await req.session.save();

                return res.status(200).json({ created: true, message: 'Success' });
            } else {
                // User is already registered
                return res.status(200).json({ created: false, message: 'Email already in use' });
            }
        } else {
            // Token payload is not retrieved
            return res.status(200).json({ created: false, message: 'Invalid token' });
        }
    } catch (e) {
        console.error(e); // Always good to log the error
        return res.status(500).json({ error: 'Failed to create an account', details: onmessage });
    }
}

export default withSession(addNewUserHandler);
