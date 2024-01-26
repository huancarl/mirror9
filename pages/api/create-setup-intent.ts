import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
}

const stripe = require("stripe")(stripeSecretKey);


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

      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      let customer;

      if (existingCustomers.data.length > 0) {
        // Customer exists, use the existing customer's ID
        customer = existingCustomers.data[0];

      } else {
        // No customer exists with that email, create a new one
        customer =
            await stripe.customers.create({
            email: userEmail,});
      }

      const setupIntent = await createSetupIntent(customer.id);

      res.status(200).json({ clientSecret: setupIntent.client_secret });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}