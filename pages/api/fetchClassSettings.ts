import {connectToDb} from '@/config/db';
import fs from 'fs/promises';
import path from 'path';

export default async (req, res) => {
    const { courseName, courseSubject } = req.body;

    if (!courseName) {
        return res.status(400).json({ error: 'Course name and subject are required' });
    }

    try {
        const db = await connectToDb();
        const botSettings = db.collection('chatbotSettings');
  
        const settingsMapping = path.join(process.cwd(), 'utils', 'subjectDefaultSettingsMap.json');
        const settingData = await fs.readFile(settingsMapping, 'utf8');
        const defaultSettings = JSON.parse(settingData);

        let resSettings = {};

        //Each document in the database has the name of the class and the matching settings for it
        const settingsDoc = await botSettings.findOne({className: courseName});
  
        if(settingsDoc){
            //If settings exist make sure to load it based on the current default settings values

            //Professor's last saved settings
            const lastSavedSettings = settingsDoc.settings;

            //Set the baseline settings that are universal for all classes
            const baselineSettings = defaultSettings["baseline"];
            
            //"Baseline" has settings divided under headers, we need to go through each one
            for (let i = 0; i < baselineSettings.length; i++) {

                const questionsObj = baselineSettings[i][1];
            
                // Now iterate through the questions object
                for (const question in questionsObj) {
                    const defaultAnswer = questionsObj[question][0][0];
                    if (questionsObj.hasOwnProperty(question)) {

                        //If the setting exists in the database
                        if(lastSavedSettings.hasOwnProperty(question)){
                            resSettings[question] = lastSavedSettings[question];
                        }
                        else{
                            resSettings[question] = defaultAnswer;
                        }
                    }
                }
            }

            //Set the subject settings for this class
            const subjectSettings = defaultSettings[courseSubject];

            for (let i = 0; i < subjectSettings.length; i++) {
                const questionsObj = subjectSettings[i][1];
                // Now iterate through the questions object
                for (const question in questionsObj) {
                    const defaultAnswer = questionsObj[question][0][0];
                    if (questionsObj.hasOwnProperty(question)) {
                        //If the setting exists already in the database, we want to return the saved setting
                        if(lastSavedSettings.hasOwnProperty(question)){
                            resSettings[question] = lastSavedSettings[question];
                        }
                        else{
                            resSettings[question] = defaultAnswer;
                        }
                    }
                }
            }
            //Finally after setting the baseline and subject settings we can save it to the database
            await botSettings.updateOne(
                { className: courseName }, 
                { $set: { settings: resSettings } }, // Update: set the 'settings' field
            );
            

            return res.status(200).json({ fetched: true, settings: resSettings, default: defaultSettings});
        }

        else{
            //Settings do not exist in the database
            const baselineSettings = defaultSettings["baseline"];
            //"Baseline" has settings divided under headers, we need to go through each one
            for (let i = 0; i < baselineSettings.length; i++) {
                const questionsObj = baselineSettings[i][1];
            
                // Now iterate through the questions object
                for (const question in questionsObj) {
                    const defaultAnswer = questionsObj[question][0][0];

                    if(question === "Each chatbot is specialized for their subject. Select the one that best fits your class"){
                        resSettings[question] = courseSubject;
                    }
                    else{
                        if (questionsObj.hasOwnProperty(question)) {
                            resSettings[question] = defaultAnswer;
                        }
                    }
                }
            }
            //Set the subject settings for this class
            const subjectSettings = defaultSettings[courseSubject];

            for (let i = 0; i < subjectSettings.length; i++) {
                const questionsObj = subjectSettings[i][1];
                // Now iterate through the questions object
                for (const question in questionsObj) {
                    const defaultAnswer = questionsObj[question][0][0];

                    if (questionsObj.hasOwnProperty(question)) {
                        resSettings[question] = defaultAnswer;
                    }
                }
            }

            await botSettings.insertOne({
                className: courseName,
                settings: resSettings,
            });


          return res.status(200).json({ fetched: false, settings: resSettings, default: defaultSettings});
        }
    
    } catch (error) {
        console.error('Failed to create/fetch a new refer', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

}