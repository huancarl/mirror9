import fs from 'fs/promises';
import path from 'path';
import {connectToDb} from '@/config/db';

export default async function handler(req, res) {

  try{

    const { userID} = req.body;

    console.log(userID);

    const db = await connectToDb();
    const profs = db.collection('verifiedProfessors');
    const profDoc = await profs.findOne({ userEmail: userID });

    if(!profDoc){
      return res.status(500).json({ profClass: 'Professor not found' });
    }
    return res.status(200).json({ profClass: profDoc.class, profSubject: profDoc.subject });
  }
  catch(e){
    console.log('Error in class mapping', e)
  }
}
