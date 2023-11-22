import {useEffect, useState} from 'react';
import {
    PaymentElement,
    useStripe,
    useElements
  } from "@stripe/react-stripe-js";
import styles from '@/styles/MessageLimitModal.module.css';

const MessageLimitModal = ({ setShowLimitReachedModal, clientS }) => {
    
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [userID, setUserID] = useState(null);
  const fetchUserInfo = async () => {
    try {
        const response = await fetch('/api/userInfo');
        const data = await response.json();
        if (data.email) {
            return data.email;
        } else {
            console.error('User info not found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
  };
  useEffect(() => {
    const getUserInfo = async () => {
        const userEmail = await fetchUserInfo();
        setUserID(userEmail); // Set the userID state with the fetched email on mount
    };
    getUserInfo();
  }, []);

  const updateUserInfo = async (paymentDetails) => {
    try {
      const response = await fetch('/api/updateUserSubStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID: userID, // Replace with actual user ID
          paymentDetails, // This should include any relevant payment details
        }),
      });
      const data = await response.json();
      console.log(data.message); // 'User updated successfully'
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };


useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = clientS;

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        if (paymentIntent) {
            switch (paymentIntent.status) {
                case "succeeded":
                  setMessage("Payment succeeded!");
                  break;
                case "processing":
                  setMessage("Your payment is processing.");
                  break;
              }
        }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: "http://localhost:3000/chatbot",
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
        setMessage(error.message || "An error occurred.");
    } 
    setIsLoading(false);

    };

  const paymentElementOptions = {
    layout: "tabs",
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