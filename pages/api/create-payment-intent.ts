import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
}

const stripe = require("stripe")(stripeSecretKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { userEmail } = req.body;

      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        // Add additional customer details if necessary
      });

      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: 'price_1OEJZrECgQOH9vuBpTrg5DuE' }], // Replace with your actual Stripe Price ID
        expand: ['latest_invoice.payment_intent'],
      });

      res.send({
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });

    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Error creating payment intent'});
    }
  } else {
    // Handle any other HTTP methods not supported
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}