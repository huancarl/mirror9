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
  
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000/chatbot",
      },
    });
  
    if (error) {
      setMessage(error.message || "An error occurred.");
      setIsLoading(false);
    } else {
      // Call API to create subscription here
      try {
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userID }),
        });
  
        const subscriptionData = await response.json();
        if (response.ok) {
          setMessage("Subscription successful!");
          // Additional success handling
        } else {
          throw new Error(subscriptionData.message || "Subscription failed.");
        }
      } catch (err) {
        setMessage("Error");
        console.error('Subscription error:', err);
      }
      setIsLoading(false);
    }
  };
      
      return (
        <>
        <div className={styles.modalBackdrop} onClick={() => setShowLimitReachedModal(false)} />
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              {/* Stripe UI on the left */}
                <div className={styles.modalPayment}>
                <h2> For only $9.99 a month get unlimited messages for CornellGPT</h2>

                  <form id="payment-form" onSubmit={handleSubmit}>
                    <PaymentElement id="payment-element" />
                    <button disabled={isLoading || !stripe || !elements} id="submit">
                      <span id="button-text">
                        {isLoading ? <div className="spinner" id="spinner"></div> : "Subscribe"}
                      </span>
                    </button>
                    {message && <div id="payment-message">{message}</div>}
                  </form>

                </div>

                {/* Message on the right */}
                <div className={styles.modalMessage}>
                <h2>Message Limit Reached.</h2>
                <h2>Upload Your Materials to CornellGPT</h2>
                <p>We will verify it and grant you unlimited acess for FREE.</p>
                <button className={styles.button} onClick={() => setShowLimitReachedModal(false)}>Close</button>
                </div>
            </div>
          </div>

        </>
    );
};

export default MessageLimitModal;