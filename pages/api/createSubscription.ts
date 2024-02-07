import {connectToDb }from '@/config/db';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
}
const stripe = require("stripe")(stripeSecretKey);

export default async function createSubscriptionHandler(req, res) {
    try {
        const {customerID } = req.body;

        const stripePriceID = process.env.STRIPE_PRICE_ID;
        if (!stripePriceID) {
            throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
        }

        // Create the subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerID,
            items: [{ price: stripePriceID }], 
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        });

        const nextBillingDateUnix = subscription.current_period_end;
        const nextBillingDate = new Date(nextBillingDateUnix * 1000).toISOString();
   
        res.status(200).json({
            subscriptionID: subscription.id,
            nextBillingDate: nextBillingDate,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        });



    } catch (error) {
        console.error('Error in createSubscriptionHandler:', error);
        res.status(500).send({ error: 'Error with creating sub' });
    }
}