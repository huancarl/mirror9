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
          signInDiv, // This should be an HTMLElement reference where the button will be placed.
          { theme: "filled_white", size: "large" } // Changed theme and size.
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
      if(data.isProfessor){
        //User is a professor
        router.replace('/professorSide');
      }
      else{
        router.replace('/coursePage');
      }
      
    } else {
      setShowErrorMessage(true);
    }
  };

  const handleBack = () => {
    router.back(); // This will take the user to the previous page
  };

  return (
<div className={styles.container}>
<button onClick={handleBack} className={styles.backButton}>←</button>
    <div className={styles.LogIn}>
        Welcome Back
        
        <div className={styles.noteText}>
            Use your @cornell.edu email

        </div>
    </div>
    <div id="signInDiv" className={styles.signDiv}></div> {/* This div will be replaced with the Google button */}
    {showErrorMessage && 
        <div className={styles.errorMessage}>
            <span>⚠️</span> {/* Caution symbol */}
            <span>Error! You must sign up first.</span>
        </div>
    }
    <footer className={styles.footer}>
    <a href="https://mountain-pig-87a.notion.site/Terms-Of-Use-CornellGPT-96c16de16cc94ff5b574fb4632b069e9" className={styles.footerLink} target="_blank">Terms of Use</a> |
        <a href="https://mountain-pig-87a.notion.site/Privacy-Policy-CornellGPT-6f20ea4c7a7741eabe19bfee5004a069" className={styles.footerLink} target="_blank">Privacy Policy</a>
    </footer>
</div>

  );
};
export default LoginWithEmail;
