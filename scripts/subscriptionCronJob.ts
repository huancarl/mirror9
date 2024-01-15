import connectToDb from '@/config/db';
import Stripe from 'stripe';
import cron from 'node-cron';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


// Cron Job Schedule - Adjust the schedule as needed
cron.schedule('0 0 * * *', async () => {
  try {

    // Connect to MongoDB
    const db = await connectToDb();
    const userCollection = db.collection('verifiedUsers');

    // Get current date
    const currentDateISO = new Date().toISOString();

    // Find subscriptions that are ending today
    const query = {
      subscriptionEndDt: { $lte: currentDateISO },
      paid: true
    };
    const expiringSubscriptions = await userCollection.find(query).toArray();

    console.log(currentDateISO);
    console.log(expiringSubscriptions, 'Expiring subscriptions');

    for (const sub of expiringSubscriptions) {
      // Check Stripe for payment status
      const subscription = await stripe.subscriptions.retrieve(sub.stripeSubID);

      if (subscription.status === 'active') {
        // Handle successful payment
        
        const newEndDate = subscription.current_period_end;
        const nextBillingDate = new Date(newEndDate * 1000).toISOString();

        sub.paid = true;
        sub.subscriptionEndDt = nextBillingDate;
        
        // Update the document in the database
        await userCollection.updateOne(
        { _id: sub._id }, // Use the unique identifier of the sub object
        { $set: sub } // Set the updated sub object
        );

      } else {
        // Handle failed or pending payment
        // e.g., send reminder, deactivate subscription, etc.

        sub.subscriptionStatus = false; 
        sub.subscriptionEndDt = null;

        // Update the document in the database
        await userCollection.updateOne(
        { _id: sub._id }, // Use the unique identifier of the sub object
        { $set: sub } // Set the updated sub object
        );

      }
    }

  } catch (error) {
    console.error("Error running cron job:", error);
  }
});
