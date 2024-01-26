import connectToDb from '@/config/db';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const sendPaymentFailedEmail = async (userEmail, link) => {

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", // Host for Gmail's SMTP server
        port: 465,             // Port for secure SMTP
        secure: true,          // Use SSL
        auth: {
            user: 'cornellgptnotice@gmail.com', // Your Gmail address
            pass: 'zrgh yyvb iter rhcz'     // Your App Password
        }
    });

  //zrgh yyvb iter rhcz

  await transporter.sendMail({
    from: 'CornellGPT <no-reply@gptcornell.com>',
    to: userEmail,
    subject: "Payment Failed",
    html: `<p>Your recent subscription payment for the next month has failed for CornellGPT and has been cancelled. Please check your payment method and 
    purchase another separate subscription. Thank you for supporting us. <a href='${link}'>CornellGPT</a></p>`,
  });
};

// Test the cron job with the function below MAKE SURE TO USE TEST KEYS FOR STRIPE WHEN TESTING
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

async function test() {

  sendPaymentFailedEmail('ch976@cornell.edu', 'gptcornell.com');

  try {

    // Connect to MongoDB
    const db = await connectToDb();
    const userCollection = db.collection('verifiedUsers');

    // Get current date
    const currentDateISO = new Date().toISOString();

    // Find subscriptions that are ending today
    const query = {
      subscriptionEndDt: { $lte: currentDateISO },
      paid: true
    };
    const expiringSubscriptions = await userCollection.find(query).toArray();

    console.log(currentDateISO);
    console.log(expiringSubscriptions, 'Expiring subscriptions');

    for (const sub of expiringSubscriptions) {
      // Check Stripe for payment status

      const subscription = await stripe.subscriptions.retrieve(sub.stripeSubID);

      if(subscription.status === 'canceled'){
        // Subscription has been cancelled 
        // so now we remove it from Mongo now that their subscription has expired

        // Update the document in the database
        await userCollection.updateOne(
        { _id: sub._id }, // Use the unique identifier of the sub object
        { $set: {paid: false, subscriptionEndDt: null, stripeSubID: null} } // Set the updated sub object
        );

        console.log(`user cancelled subscription ${sub.userEmail}`);
      }
      else if (subscription.status === 'active') {
        // Handle successful payment
        
        const newEndDate = subscription.current_period_end;
        const nextBillingDate = new Date(newEndDate * 1000).toISOString();
        
        // Update the document in the database
        await userCollection.updateOne(
        { _id: sub._id }, // Use the unique identifier of the sub object
        { $set: {paid: true, subscriptionEndDt: nextBillingDate}} // Set the updated sub object
        );

        console.log(`Subscription for ${sub.userEmail} has been renewed with payment`);

      } else if (subscription.status === 'past_due') {
        // Handle failed or pending payment
        // e.g., send reminder, deactivate subscription, etc.

        await stripe.subscriptions.cancel(sub.stripeSubID);

        // Update the document in the database
        await userCollection.updateOne(
        { _id: sub._id }, // Use the unique identifier of the sub object
        { $set: {paid: false, subscriptionEndDt: null, stripeSubID: null} } // Set the updated sub object
        
        );

        await sendPaymentFailedEmail(sub.userEmail, 'gptcornell.com');

        console.log(`Customer is no longer subscribed ${sub.userEmail}`)
      }
      else{

        // Something went wrong with the subscription cancel it on the backend

        await stripe.subscriptions.cancel(sub.stripeSubID);

        // Update the document in the database
        await userCollection.updateOne(
            { _id: sub._id }, // Use the unique identifier of the sub object
            { $set: {paid: false, subscriptionEndDt: null, stripeSubID: null} } // Set the updated sub object
            
            );
    
        await sendPaymentFailedEmail(sub.userEmail, 'gptcornell.com');
        console.log(`Customer is no longer subscribed ${sub.userEmail}`)
      }
    }

  } catch (error) {
    console.error("Error running cron job:", error);
  }
}

test();



