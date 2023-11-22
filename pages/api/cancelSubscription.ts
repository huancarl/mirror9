import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectToDb from '@/config/db';

async function getSubscriptionIdByEmail(userEmail) {
  // Retrieve customer by email
  const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
  const customer = customers.data[0];

  if (!customer) {
    return null; // Customer not found
  }

  // List subscriptions for the customer
  const subscriptions = await stripe.subscriptions.list({ customer: customer.id, limit: 1 });
  const subscription = subscriptions.data[0];

  return subscription ? subscription.id : null; // Return subscription ID or null if not found
}

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Extract the subscription ID from the request body
      const { userID, subscriptionId } = req.body;

      const userEmail = userID;
        getSubscriptionIdByEmail(userEmail)
        .then()
        .catch(error => console.error(error));

      // Cancel the subscription
      const canceledSubscription = await stripe.subscriptions.del(subscriptionId);

      // Update database or perform additional logic as needed
      if(canceledSubscription){
        const db = await connectToDb();
        const allUsers = db.collection('verifiedUsers');
        const filter = {userID: userEmail, paid: true};
        const update = {
            $set: {
                paid: false, // Replace with the field you want to update and the new value
            },
        }
        const result = await allUsers.updateOne(filter, update);
      }
      // Send a success response
      res.status(200).json({ message: 'Subscription canceled successfully', canceledSubscription });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
  }
}