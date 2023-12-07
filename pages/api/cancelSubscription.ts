import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectToDb from '@/config/db';

// Initialize Stripe with TypeScript assertion for non-null values
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

async function getSubscriptionIdByEmail(userEmail: string) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Extract the user ID from the request body
      const { userID } = req.body;

      // Retrieve the subscription ID using the user's email
      const subscriptionId = await getSubscriptionIdByEmail(userID);

      if (!subscriptionId) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      // Cancel the subscription
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

      // Update database or perform additional logic as needed
      if (canceledSubscription) {
        const db = await connectToDb();
        const allUsers = db.collection('verifiedUsers');
        const filter = { userID: userID, paid: true };
        const update = {
          $set: {
            paid: false, // Set paid status to false
          },
        };
        const result = await allUsers.updateOne(filter, update);
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
