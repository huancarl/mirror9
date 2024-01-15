export default async function createStripeCustomerHandler(req, res) {
    try{
        const { userEmail} = req.body;
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
        throw new Error('The STRIPE_SECRET_KEY environment variable is not set.');
        }
        const stripe = require("stripe")(stripeSecretKey);

        const existingCustomers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });

        let customer;

        if (existingCustomers.data.length > 0) {
            // Customer exists, use the existing customer's ID
            customer = existingCustomers.data[0];
            console.log('Existing Stripe customer ID:', customer.id);
        } else {
            // No customer exists with that email, create a new one
            customer =
                await stripe.customers.create({
                email: userEmail,});
        }

        res.status(200).json({
            success: true,
            customerID: customer.id,
        });
    }
    catch (error){
        res.status(500).send({ error: 'Error with creating customer' });
    }       
}