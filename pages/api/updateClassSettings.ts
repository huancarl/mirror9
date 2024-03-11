import {connectToDb} from '@/config/db';
import fs from 'fs/promises';
import path from 'path';

export default async (req, res) => {
    const { settingsToSave, courseName, courseSubject, customInstructions } = req.body;

    if (!settingsToSave) {
        return res.status(400).json({ error: 'Settings are required' });
    }

    try {
        const db = await connectToDb();
        const botSettings = db.collection('chatbotSettings');

        const settingsDoc = await botSettings.findOne({className: courseName});

        if(!settingsDoc){
            return res.status(500).json({error: "Settings not found"});
        }

        let lastSaved = settingsDoc.settings;

        Object.keys(lastSaved).forEach(key => {

            if(key === 'Custom Instructions'){
                lastSaved[key] = customInstructions;
            }
            else{
                lastSaved[key] = settingsToSave[key];  
            }
          });

        //After finishing updating lastSaved
        await botSettings.updateOne(
            { className: courseName }, 
            { $set: { settings: lastSaved } }, // Update: set the 'settings' field
        );

        return res.status(200).json({ updated: true});

    } catch (error) {
        console.error('Failed to update settings', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

}