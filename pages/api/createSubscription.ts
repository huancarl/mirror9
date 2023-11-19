import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
}

const stripe = new Stripe(stripeSecretKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { paymentMethodId } = req.body;

      // Create a Customer
      const customer = await stripe.customers.create({
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: process.env.STRIPE_PRICE_ID }],
        expand: ['latest_invoice.payment_intent'],
      });

      res.status(200).json(subscription);
    } catch (error) {
      res.status(400).json({ error: { message: 'error creating a subscription' } });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}