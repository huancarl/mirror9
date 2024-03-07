import {connectToDb} from '@/config/db';

export default async (req, res) => {
    const { courseName, settings } = req.body;

    if (!courseName || !settings) {
        return res.status(400).json({ error: 'UserID and settings are required' });
    }

    try {
        const db = await connectToDb();
        const botSettings = db.collection('chatbotSettings');
  
        const settingsDoc = await botSettings.findOne({className: courseName})
  
        if(settingsDoc){
          return res.status(200).json({ fetched: true, settings: settingsDoc.settings});
        }
        else{
            //Settings do not exist in  
            const defaultSettings = settings;

            await botSettings.insertOne({
                className: courseName,
                settings: defaultSettings,
            });

          return res.status(200).json({ fetched: false, settings: defaultSettings});
        }
    
    } catch (error) {
        console.error('Failed to create/fetch a new refer', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

}