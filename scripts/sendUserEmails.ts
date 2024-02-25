import {connectToDb} from '@/config/db';
import nodemailer from 'nodemailer';


const sendEmailAnnouncements = async (userEmail) => {

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // Host for Gmail's SMTP server
        port: 465,             // Port for secure SMTP
        secure: true,          // Use SSL
        auth: {
            user: 'cornellgptnotice@gmail.com', // Your Gmail address
            pass: 'zrgh yyvb iter rhcz'     // Your App Password
        }
    });
  
  await transporter.sendMail({
    from: 'CornellGPT <no-reply@gptcornell.com>',
    to: userEmail,
    subject: "CornellGPT Feedback!",
    html: `<p>
    
    <p>Hey Cornellian,</p>

    <p>We've noticed you gave CornellGPT a try! Thank you for that. Studying is hard and we felt that students like you deserve powerful tools to ace your classes.</p>
    <p>Please fill out this form (it would only take 2-3 mins) to let us know how the site is working for you so far. We would love to hear your feedback!</p>

    <p><a href="https://docs.google.com/forms/d/e/1FAIpQLSdZ9c7g3k6lDYSUruAY9S0Jq-zijnmIGDY06yLIHlgM4lCj4w/viewform?usp=sf_link">Click here to fill out the feedback form</a></p>

    <p>Thank you for supporting us. CornellGPT</p>`,
    });
};

export async function run(){
    try {
        const db = await connectToDb();
        const userCollection = db.collection('verifiedUsers');

        //Get all users
        const verifiedUsers = await userCollection.find().toArray();

        for (const user of verifiedUsers){
            const email = user.userEmail;
        }

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

(async () => {
    await run();
})();