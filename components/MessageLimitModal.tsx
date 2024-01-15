import {useEffect, useState} from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
  } from "@stripe/react-stripe-js";
import styles from '@/styles/MessageLimitModal.module.css';

const MessageLimitModal = ({ setShowLimitReachedModal, clientS}) => {
    
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [userID, setUserID] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/userInfo');
        const data = await response.json();
        if (data.email) {
          setUserID(data.email);
        } else {
          console.error('User info not found');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchUserInfo();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    if (!stripe || !elements) {
      console.log("Stripe.js has not loaded yet.");
      setIsLoading(false);
      return;
    }
  
    try {

      const {error: submitError} = await elements.submit();
      if (submitError) {
        setMessage(`Error creating subscription. ${submitError}`);
        return;
      }

      //Create customer on backend
      const customerResponse = await fetch('/api/createStripeCustomer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: userID, }),
      });
      const customerResponseData = await customerResponse.json();
      const customerID = customerResponseData.customerID;

      //Create Subscription Intent via Backend
      const subscriptionIntentResponse = await fetch('/api/createSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerID: customerResponseData.customerID}),
      });
  
      const subscriptionIntentData = await subscriptionIntentResponse.json();
      if (subscriptionIntentData.error) {
        throw new Error(subscriptionIntentData.message || "Subscription Intent creation failed.");
      }

      const nextSubBillingDate = subscriptionIntentData.nextBillingDate;
      const subID = subscriptionIntentData.subscriptionID;

      // Give Subscription Creation on Backend
      const finalizeResponse = await fetch('/api/giveSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: userID, billingDate: nextSubBillingDate, customerID: customerID, subID: subID}),
      });
  
      const finalizeData = await finalizeResponse.json();
      if (finalizeData.error) {
        throw new Error(finalizeData.message || "Subscription finalization failed.");
      }

      const {clientSecret} = subscriptionIntentData;

      const { error } = await stripe.confirmPayment({
        clientSecret,
        elements,
        confirmParams: {
          return_url: 'http://localhost:3000/coursePage',
        },
      });

      if (error) {
        // This point is only reached if there's an immediate error when
        // confirming the payment. Show the error to your customer (for example, payment details incomplete)

        setMessage(`Error creating subscription. Please ensure that your payment information is correct.`);

        //Remove the sub because they did not pay for it
        const errorResponse = await fetch('/api/removeSubscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: userID}),
        });
        
      } else {
        // Your customer is redirected to your `return_url`. For some payment
        // methods like iDEAL, your customer is redirected to an intermediate
        // site first to authorize the payment, then redirected to the `return_url`.
      }
  
    } catch (err) {
      setMessage("Error creating subscription.");
      console.error('Subscription error:', err);
    }
    setIsLoading(false);
  };
  
      
  return (
<>
  <div className={styles.modalBackdrop} onClick={() => setShowLimitReachedModal(false)} />
  <div className={styles.modal}>
  <button className={styles.closeButton} onClick={() => setShowLimitReachedModal(false)}>🆇</button>
    <div className={styles.modalLeft}>
      <div className={styles.modalPayment}>
        <h2 className={styles.priceHeader}>$9.99/month UNLIMITED</h2>
        <form id="payment-form" onSubmit={handleSubmit}>
          <PaymentElement id="payment-element" />
          <button
            disabled={isLoading || !stripe || !elements}
            id="submit"
            className={isLoading ? styles.spinner : styles.subscribeButton}
          >
            {isLoading ? <div className={styles.spinner}></div> : "Subscribe"}
          </button>
          <a href="https://forms.gle/tvBPKA2bQnkjsAk56" className={styles.smallText} target="_blank" rel="noopener noreferrer">OR UPLOAD MATERIALS</a>
          <div className={styles.referralfootnoteText}>REFER</div> 
          {message && <div id="payment-message">{message}</div>}
        </form>
      </div>
    </div>
    </div>
</>

  );
};

export default MessageLimitModal;