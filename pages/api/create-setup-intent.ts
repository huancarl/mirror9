import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
}

const stripe = require("stripe")(stripeSecretKey);

async function createStripeCustomer(userEmail) {
  try {
    const customer = await stripe.customers.create({
      email: userEmail,
    });
    return customer; // This object includes the customer's Stripe ID
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error; // or handle it as per your application's error handling policy
  }
}

async function createSetupIntent(customerId) {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userEmail } = req.body;
    try {
      // Create a SetupIntent
      const customer = await createStripeCustomer(userEmail);
      const setupIntent = await createSetupIntent(customer.id);

      res.status(200).json({ clientSecret: setupIntent.client_secret });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}