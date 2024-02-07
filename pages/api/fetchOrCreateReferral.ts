import {connectToDb} from '@/config/db';
import { v4 as uuidv4 } from 'uuid';

export default async (req, res) => {
    const { userID } = req.body;
  
    if (!userID) {
      return res.status(400).json({ error: 'UserID is required' });
    }
  
    try {
      const db = await connectToDb();
      const referrals = db.collection('referrals');

      const refDoc = await referrals.findOne({ userID})

      if(refDoc){
        return res.status(200).json({ fetched: true, code: refDoc.code});
      }
      else{
        const referralCode = uuidv4().substring(0, 9);;
        await referrals.insertOne({
          code: referralCode,
          date_created: new Date(),
          valid: true,
          userID: userID,
        });
        return res.status(200).json({ fetched: false, code: referralCode });
      }
  
    } catch (error) {
      console.error('Failed to create/fetch a new refer', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
};