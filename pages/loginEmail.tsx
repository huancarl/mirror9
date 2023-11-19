import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Login.module.css';

declare global {
    interface Window {
      google: {
        accounts: {
          id: {
            initialize: (config: { client_id: string; callback: (response: any) => void; }) => void;
            renderButton: (element: HTMLElement, options: { theme: string; size: string; }) => void;
            prompt: (notification?: (notification: any) => void) => void; // Add this line
          }
        }
      }
    }
  }

const LoginWithEmail: React.FC = () => {
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const router = useRouter();
  const [isGapiReady, setIsGapiReady] = useState(false);

  useEffect(() => {
    // Load Google Identity Services library
    const initializeGis = () => {
      window.google.accounts.id.initialize({
        client_id: "143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com",
        callback: handleCredentialResponse
      });
      const signInDiv = document.getElementById("signInDiv");
      if (signInDiv) {

        window.google.accounts.id.renderButton(
          signInDiv, // Now it's guaranteed to be an HTMLElement, not null
          { theme: "outline", size: "large" } // Customize button appearance
        );
        setIsGapiReady(true);
      } else {
        console.error("Google Sign In div not found");
      }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = initializeGis;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup the script when the component unmounts
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    // The response will contain the JWT token
    const result = await fetch('/api/verifyLogin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: response.credential }),
    });

    const data = await result.json();
    if (data.success) {
      router.replace('/coursePage');
    } else {
      setShowErrorMessage(true);
      setTimeout(() => {
        setShowErrorMessage(false);
        router.push('/');
      }, 4000);
    }
  };

  const handleBack = () => {
    router.back(); // This will take the user to the previous page
  };


  return (
    <div className={styles.container}>
        <button onClick={handleBack} className={styles.backButton}>←</button>
      <div className={styles.LogIn}>
        Welcome Back!
        
        <div className={styles.noteText}>
          You must signup with a referral link before logging in. 
          If help is needed please send us an email at 
          <a href="mailto:cornellgpt@gmail.com" className={styles.emailLink}> cornellgpt@gmail.com</a>
        </div>
      </div>
      <div className={styles.logIn}></div>
      <div id="signInDiv" className={styles.signDiv}></div> {/* This div will be replaced with the Google button */}
      {showErrorMessage && 
        <div className={styles.errorMessage}>
        <span>⚠️</span> {/* Caution symbol */}
        <span>Error! You must sign up first.</span>
      </div>}
      <footer className={styles.footer}>
        <a href="/terms-of-use" className={styles.footerLink}>Terms of Use</a> | 
        <a href="/privacy-policy" className={styles.footerLink}>Privacy Policy</a>
        </footer>
    </div>
  );
};
export default LoginWithEmail;
