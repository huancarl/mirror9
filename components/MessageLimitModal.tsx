import React from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import styles from '@/styles/MessageLimitModal.module.css';

const MessageLimitModal = ({ setShowLimitReachedModal }) => {
    
    const stripe = useStripe();
    const elements = useElements();
    
    const handleSubmit = async (event) => {
        event.preventDefault();
      
        if (!stripe || !elements) {
          // Stripe.js has not loaded yet. Make sure to disable
          // form submission until Stripe.js has loaded.
          return;
        }
      
        // Get a reference to a mounted CardElement. Elements knows how
        // to find your CardElement because there can only ever be one of
        // each type of element.
        const cardElement = elements.getElement(CardElement);
      
        if (cardElement) {
          // Use your stripe instance to confirm the payment
          const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
          });
      
          if (error) {
            console.log('[error]', error);
          } else {
            console.log('[PaymentMethod]', paymentMethod);
            const response = await fetch('/createSubscription', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  paymentMethodId: paymentMethod.id
                })
              });
          
              const subscriptionResult = await response.json();
          
              if (response.ok) {
                console.log('Subscription created:', subscriptionResult);
                // Here you might want to navigate the user to a new page or
                // display a confirmation message
              } else {
                console.error('Subscription creation failed:', subscriptionResult);
                // Handle errors here, such as displaying a notification to the user
              }
          }
        } else {
          console.log('CardElement not found');
        }
      };
      
      const isStripeLoaded = stripe !== null;
      return (
        <>
          <div className={styles.modalBackdrop} onClick={() => setShowLimitReachedModal(false)} />
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Message Limit Reached</h2>
              <p>You have exceeded your limit for messages.</p>
              <form onSubmit={handleSubmit} autoComplete="off">
                <div className={styles.formLabel}>Card Information</div>
                <CardElement className={styles.StripeElement} />
                <button className={styles.button} type="submit" disabled={!isStripeLoaded}>Subscribe</button>
              </form>
              <button className={styles.button} onClick={() => setShowLimitReachedModal(false)}>Close</button>
            </div>
          </div>
        </>
      );
};

export default MessageLimitModal;