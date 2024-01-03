import connectToDb from '@/config/db';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
}

const stripe = require("stripe")(stripeSecretKey);

export default async function createSubscriptionHandler(req, res) {
    try {
        const { userEmail } = req.body;

        // Retrieve or create Stripe customer
        let customer = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });

        if (customer.data.length === 0) {
            customer = await stripe.customers.create({
                email: userEmail,
            });
        } else {
            customer = customer.data[0];
        }

        // Create the subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: 'price_1OEJZrECgQOH9vuBpTrg5DuE' }], 
            expand: ['latest_invoice.payment_intent'],
        });

        res.status(200).json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        });
    } catch (error) {
        console.error('Error in createSubscriptionHandler:', error);
        res.status(500).send({ error: 'Error with creating sub' });
    }
}