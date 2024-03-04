import {connectToDb }from '@/config/db';
import { OAuth2Client } from 'google-auth-library';
import { withSession } from 'utils/session'; // Adjust the import path as needed
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const client = new OAuth2Client("143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com");

async function addNewUserHandler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    try {
        const { token, link } = req.body;
        let userUsedRef: boolean = false;
        let isProfessor: boolean = false;

        //Handle LogIn/Sign In
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();

        if (payload && payload.email) {
            const userEmail = payload.email;

            // Check if the email is a Cornell email
            if (!userEmail.endsWith('@cornell.edu')) {
                return res.status(400).json({ created: false, message: 'Cornell emails only' });
            }

            const profEmailFilePath = path.join(process.cwd(), 'utils', 'professorEmails.json');
            const profEmailData = await fs.readFile(profEmailFilePath, 'utf8');
            const profEmails = JSON.parse(profEmailData);

            if (userEmail in profEmails){
                isProfessor = true;
            }

            const db = await connectToDb();

            if(isProfessor){
                //Professor trying to signup
                const userCollection = db.collection('verifiedProfessors');
                const checkIfUserExistsAlready = await userCollection.findOne({ userEmail: userEmail });
                if (!checkIfUserExistsAlready) {
                    // If user is not registered, insert a new document

                    await userCollection.insertOne({
                        userEmail: userEmail,
                        dateCreated: new Date(),
                        paid: false,
                        subscriptionEndDt: null,
                        stripeSubID: null,
                    });

                    req.session.set('user', { email: userEmail, isProfessor: true });
                    await req.session.save();

                    if (userUsedRef){
                        return res.status(200).json({ created: true, message: 'Success', usedRef: userUsedRef, isProfessor: true });
                    }
                    return res.status(200).json({ created: true, message: 'Success', usedRef: userUsedRef, isProfessor: true });
                } else {
                    // User is already registered
                    return res.status(200).json({ created: false, message: 'Email already in use. Go to Log In.' });
                }

            }
            else{
                //Student sign up

                // Check if user is already registered
                const userCollection = db.collection('verifiedUsers');
                const checkIfUserExistsAlready = await userCollection.findOne({ userEmail: userEmail });
                if (!checkIfUserExistsAlready) {
                    // If user is not registered, insert a new document

                    //Referral link logic
                    // if(link){
                    //     const refSource = await userCollection.findOne({ ref: link });
                    //     if(refSource){
                    //         const refSourceUserID = refSource.userEmail;
                    //         //Give rewards for the referrer

                    //         //Give membership for a month
                    //         // const numOfReferred = refSource.usersReferred + 1;
                    //         // if (numOfReferred > 9 ){
                    //         //     await userCollection.updateOne({refSourceUserID}, { $set: { paid: true} {subscriptionEndDt: } });
                    //         // }
                    //         // else{}
                    //         const referrerReward = 5;
                    //         await userCollection.updateOne({userEmail: refSourceUserID}, { $inc: { usersReferred: 1, messagesLeft: referrerReward } });
                    //     }
                    // }

                    const referralCode = uuidv4();
                    let startingMessages = 10;
                    if(userUsedRef){
                        //Give rewards for the referee if applicable
                        const reward = 2;
                        startingMessages += reward;
                    }

                    await userCollection.insertOne({
                        userEmail: userEmail,
                        messagesLeft: startingMessages,
                        dateCreated: new Date(),

                        usersReferred: 0,
                        ref: referralCode,

                        paid: false,
                        subscriptionEndDt: null,
                        stripeSubID: null,
                    });


                    req.session.set('user', { email: userEmail, isProfessor: false });
                    await req.session.save();

                    if (userUsedRef){
                        return res.status(200).json({ created: true, message: 'Success', usedRef: userUsedRef, isProfessor: false });
                    }
                    return res.status(200).json({ created: true, message: 'Success', usedRef: userUsedRef, isProfessor: false });
                } else {
                    // User is already registered
                    return res.status(200).json({ created: false, message: 'Email already in use. Go to Log In.' });
                }
            }

        } 
        
        else {
            // Token payload is not retrieved
            return res.status(200).json({ created: false, message: 'Invalid token' });
        }
    } catch (e) {
        console.error(e); // Always good to log the error
        return res.status(500).json({ error: 'Failed to create an account'});
    }
}

export default withSession(addNewUserHandler);
