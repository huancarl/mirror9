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
    to: 'mpp59@cornell.edu',
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