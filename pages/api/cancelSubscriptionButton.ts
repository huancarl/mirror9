import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectToDb from '@/config/db';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
}
const stripe = require("stripe")(stripeSecretKey);

// SubID is stored in the DB already

// async function getSubscriptionIdByUserID(userEmail: string) {
//   // Retrieve customer by email
//   const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
//   const customer = customers.data[0];

//   if (!customer) {
//     return null; // Customer not found
//   }

//   // List subscriptions for the customer
//   const subscriptions = await stripe.subscriptions.list({ customer: customer.id, limit: 1 });
//   const subscription = subscriptions.data[0];

//   return subscription ? subscription.id : null; // Return subscription ID or null if not found
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Extract the user ID from the request body
      const { userID } = req.body;

      // Retrieve the subscription ID using the MongoDB 
      const db = await connectToDb();
      const userCollection = db.collection('verifiedUsers');

      const userDoc = await userCollection.findOne({ userEmail: userID, paid: true });

      if(!userDoc){
        res.status(500).json({ message: 'No subscription found on DB' });
      }

      const subID = userDoc ? userDoc.stripeSubID : null;

      const subscription = await stripe.subscriptions.retrieve(
        subID
      );


      if (!subscription || subscription.status === 'canceled') {
        // subID found, proceed with your logic
        res.status(200).json({ message: 'No subscription found on stripe' });
        return;
      } 

      // Cancel the subscription
      const canceledSubscription = await stripe.subscriptions.cancel(subscription.id);

      // Update database or perform additional logic as needed
      if (canceledSubscription) {

        // This deletes the subscription for the user on the MongoDB. We do not need to do this because 
        // the cron job will delete it on the MongoDB for us when the user's month which they paid for is up.
        // They should have the subscription until their month they paid for is up so we keep it for now on Mongo but
        // we delete it on the stripe.

        // const allUsers = db.collection('verifiedUsers');
        // const filter = { userEmail: userID, paid: true };
        // const update = {
        //   $set: {
        //     paid: false, // Set paid status to false
        //     stripeSubID: null,
        //   },
        // };
        // const result = await allUsers.updateOne(filter, update);

        // Send a success response
        res.status(200).json({ message: 'Subscription canceled successfully', canceledSubscription });

      } else {
        res.status(404).json({ error: 'Failed to cancel the subscription' });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
  }
}
