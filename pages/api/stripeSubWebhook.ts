import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectToDb from '@/config/db';

//set up email to potentially send if users cancel their plan
const nodemailer = require('nodemailer');

//set these values to appropiate values
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = 'whsec_...';

//REMEMBER TO USE THE STRIPE SIG

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    let event = req.body;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.send(400);
    }
  }
  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log(`Invoice ${invoice.id} payment succeeded for ${invoice.amount_paid}`);
      await handleInvoicePaymentSucceeded(invoice);
      break;
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`Invoice ${failedInvoice.id} payment failed`);
      // Define and call a method to handle the failed invoice payment
      await handleInvoicePaymentFailed(failedInvoice);
      break;
    // ... other subscription-related cases ...
    default:
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send(200);

  } else {
    res.status(405).end('Method Not Allowed');
  }
}

const fetchUserInfo = async () => {
    try {
        const response = await fetch('/api/userInfo');
        const data = await response.json();
        if (data.email) {
            return data.email;
        } else {
            console.error('User info not found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
  };

  const sendPaymentFailedEmail = async (userEmail) => {
    let transporter = nodemailer.createTransport({
      // Configure your SMTP server details
      host: "smtp.example.com",
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
      subject: "Payment Failed - Action Required",
      text: "Your recent subscription payment has failed for CornellGPT. Please update your payment method to renew your premium subscription.",
      // You can also use HTML content for the email body
    });
  };

async function handleInvoicePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Here, you can perform any actions on your server as a result of the payment intent succeeding.
    // For example, updating a user's subscription status in your database.
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
    // Update the user's status in the database 

    const db = await connectToDb();
    const allUsers = db.collection('verifiedUsers');
    const userEmail = fetchUserInfo();

    const filter = {userID: userEmail, paid: false};
    const update = {
        $set: {
            paid: true, // Replace with the field you want to update and the new value
          },
    }
    const result = await allUsers.updateOne(filter, update);
    return result;
  }

  async function handleInvoicePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Here, you can perform any actions on your server as a result of the payment intent succeeding.
    // For example, updating a user's subscription status in your database.
    console.log(`PaymentIntent for ${paymentIntent.amount} was unsuccessful!`);
    // Update the user's status in the database 

    const db = await connectToDb();
    const allUsers = db.collection('verifiedUsers');
    const userEmail = fetchUserInfo();

    if (userEmail) {
        await sendPaymentFailedEmail(userEmail);
      }

    const filter = {userID: userEmail, paid: true};
    const update = {
        $set: {
            paid: false, // Replace with the field you want to update and the new value
          },
    }
    const result = await allUsers.updateOne(filter, update);

    //send an email telling the user that their plan has been disabled
    
    return result;
  }