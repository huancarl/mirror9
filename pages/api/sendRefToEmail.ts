import { NextApiRequest, NextApiResponse } from 'next';
import connectToDb from '@/config/db';

const nodemailer = require('nodemailer');

const sendPaymentFailedEmail = async (userEmail, link) => {
    let transporter = nodemailer.createTransport({
      // Configure your SMTP server details
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'cornellgpt@gmail.com',
        pass: 'Bakertowerpingpong156143',
      },
    });
  
    await transporter.sendMail({
      from: 'CornellGPT <no-reply@ourdomain.com>',
      to: userEmail,
      subject: "You have received a special invite to the CornellGPT! Use the code below to signup for an account with extra benefits!",
      html: `<p>Please visit our website to sign up for an account with extra benefits. <a href='${link}'>Sign Up For CornellGPT!</a></p>`,
    });
  };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    try{
        const { userEmail, refCode } = req.body;
        
        await sendPaymentFailedEmail(userEmail, refCode);

        res.status(200).json({
            success: true,
        });

    }
    catch (error){
        console.error('Error in send ref to emails', error);
        res.status(500).send({ error: 'Error with sending email' });
    }




}

