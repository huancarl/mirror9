import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Redeem.module.css'; // Adjust the path if necessary

const AccessPage = () => {
  const router = useRouter();
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isGapiReady, setIsGapiReady] = useState(false);

  useEffect(() => {
    const initializeGis = () => {
      window.google.accounts.id.initialize({
        client_id: '143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com', // Replace with your client ID
        callback: handleCredentialResponse,
      });
      const signInDiv = document.getElementById("signInDiv");
      if (signInDiv) {
        window.google.accounts.id.renderButton(
          signInDiv,
          { theme: "filled_white", size: "large" }
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
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
    const email = decodedToken.email;
  
    if (!email.endsWith('@cornell.edu')) {
      alert('Cornell emails only (@cornell.edu)');
      return;
    }

    const result = await fetch('/api/addNewUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: response.credential }),
    });

    const data = await result.json();
    if (data.created) {
      router.replace('/coursePage');
    } else {
      alert(data.message);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <button onClick={handleBack} className={styles.backButton}>←</button>
      <div className={styles.LogIn}>
        Create Your Account
        <div className={styles.noteText}>
          You must use your @cornell.edu email
        </div>
      </div>
      <div id="signInDiv" className={styles.signDiv}></div>
      {showErrorMessage && (
        <div className={styles.errorMessage}>
          Error message if needed
        </div>
      )}
      <footer className={styles.footer}>
        <a href="/terms-of-use" className={styles.footerLink}>Terms of Use</a> | 
        <a href="/privacy-policy" className={styles.footerLink}>Privacy Policy</a>
      </footer>
    </div>
  );
};

export default AccessPage;
