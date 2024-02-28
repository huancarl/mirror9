import {connectToDb} from '@/config/db';
import nodemailer from 'nodemailer';


let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'cornellgptnotice@gmail.com',
        pass: 'kskt umxf mtci gbej'
    }
});

const sendEmailAnnouncements = async (userEmail: string) => {

  await transporter.sendMail({
    from: 'CornellGPT <no-reply@gptcornell.com>',
    to: userEmail,
    subject: "CornellGPT Early Access Feedback!",
    html: `<p>

    <p>Dear Cornellian,</p>
    
    <p>As an early access user, thank you for exploring CornellGPT! Your involvement in this early stage is invaluable to us. We are dedicated to providing students with an innovative tool to excel academically.</p>
    
    <p>Your feedback is critical in guiding the enhancements of CornellGPT. Could you please take a minute to complete this short form? Your insights will help us understand student experience and what improvements are most needed as we do our bigger releases in the upcoming weeks.</p>
    
    <p>Your responses will be kept confidential and used solely for the purpose of improving our service. Your opinion truly matters in making CornellGPT a more effective tool for all students.</p>
    
    <p><a href="https://docs.google.com/forms/d/e/1FAIpQLSdZ9c7g3k6lDYSUruAY9S0Jq-zijnmIGDY06yLIHlgM4lCj4w/viewform?usp=sf_link">Click here to fill out the feedback form</a></p>
    
    <p>We appreciate your support and are eagerly awaiting your valuable insights. Thank you for being a part of the CornellGPT community.</p>
    
    <p>Sincerely,<br>CornellGPT Team</p>
    
    `,
    
    });
};

export async function run(){
    try {
        // Sending Limits for Regular Gmail Accounts:
        // Daily limit of 500 emails per day (for every 24 hours).
        // Each email can be sent to a maximum of 100 recipients. 
        // If you send one email to 100 recipients, that counts as 100 emails towards your 500 email limit.
        // These limits are applied over a rolling 24-hour period, not a set time of day.

        const db = await connectToDb();
        const userCollection = db.collection('verifiedUsers');

        //Get all users
        const verifiedUsers = await userCollection.find().toArray();

        for (let i = 23; i < verifiedUsers.length; i++){
            const email = verifiedUsers[i].userEmail;
            await sendEmailAnnouncements(email);
            console.log(`${email}`);
        }

        console.log("Emails sent successfully");
        return;

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

(async () => {
    await run();
})();