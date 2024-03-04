import {connectToDb }from '@/config/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {


    try {
        // Extract the user ID from the request body
        const { userID, className } = req.body;
        const db = await connectToDb();

        const userCollection = db.collection('verifiedUsers');

        const updateResult = await userCollection.updateOne(
            { userEmail: userID }, 
            { $push: { unlockedClassesList: className } } // Update operation
        );

        if (updateResult.matchedCount === 0) {
            res.status(404).json({ message: 'User not found' });
        } else if (updateResult.modifiedCount === 0) {
            res.status(200).json({ message: 'No changes made to the user' });
        } else {
            res.status(200).json({ message: 'User updated successfully, array field updated' });
        }
        
      } catch (error) {
        console.error('Error updating user classes', error);
        res.status(500).json({ error: 'Internal server error' });
      }


}