import {connectToDb }from '@/config/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    try{

        const { userID } = req.body;
        const db = await connectToDb();
        const userCollection = db.collection('verifiedUsers');

        const userDoc = await userCollection.findOne({ userEmail: userID });
        
        if (userDoc) {
            const unlockedClasses = userDoc.unlockedClassesList || [];
            // Return the unlockedClasses field in the response

            res.status(200).json({ unlockedClasses });
        } else {
            // Handle case where user is not found
            res.status(404).json({ message: 'User not found' });
        }

    }
    catch(e){
        console.error('Error retrieving unlocked classes', e);
        res.status(500).json({ error: 'Internal server error' });
    }
}