import { NextApiRequest, NextApiResponse } from 'next';
import {connectToDb} from '@/config/db';

const nodemailer = require('nodemailer');

const sendEmail = async (receivingEmail, link, sendingEmail) => {
    let transporter = nodemailer.createTransport({
      // Configure your SMTP server details
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'cornellgptnotice@gmail.com',
        pass: 'zrgh yyvb iter rhcz',
      },
    });
  
    await transporter.sendMail({
      from: 'CornellGPT <no-reply@gptcornell.com>',
      to: receivingEmail,
      subject: `You have received a special invite to CornellGPT from ${receivingEmail}! Use the code below to signup for an account with extra benefits!`,
      html: `<p>Please visit our website to sign up for an account with extra benefits. <a href='${link}'>Sign Up For CornellGPT!</a></p>`,
    });
  };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    try{
        const { sender, receiver, refCode } = req.body;
        
        await sendEmail(receiver, refCode, sender);

        res.status(200).json({
            success: true,
        });

    }
    catch (error){
        console.error('Error in send ref to emails', error);
        res.status(500).send({ error: 'Error with sending email' });
    }




}

