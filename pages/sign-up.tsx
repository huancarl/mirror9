import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/Redeem.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';

function AccessPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);

  const inputValueRef = useRef('');

  const handleCredentialResponse = async (response) => {

    const result = await fetch('/api/addNewUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: response.credential, link: inputValueRef.current}),
    });
    const data = await result.json();
    if(data.created){
      router.replace('/coursePage');
    }
    else{
      alert(data.message);
    }
  };

  let timerId;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: '143724527673-n3nkdbf2gh0ea2lgqrthh6k4142sofv1.apps.googleusercontent.com',
        callback: handleCredentialResponse,
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      setShowSignInModal(true);
    }, 2000);
  }, []);

  const verifyLink = async (link) => {

    let response = await fetch('/api/verifyLink', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          link,
      }),
    });

    const data = await response.json();

    if(link.length!==0){
      return data.isValid;
    }

  };

  useEffect(() => {
    if (showSignInModal && !buttonRendered && window.google && window.google.accounts && window.google.accounts.id) {
      setButtonRendered(true);
      const signInDiv = document.getElementById("signInDiv");
      if (signInDiv) {
        window.google.accounts.id.renderButton(
          signInDiv,
          { theme: "filled_blue", size: "large" } // Customize button appearance
        );
      }
    }
  }, [showSignInModal]); 


  const handleInputChange = async (event) => {
    const value = event.target.value;
    setInputValue(value);

    const valid = await verifyLink(value);
    setIsValid(valid);

    if (valid) {
      // Delay showing the sign-in modal
      setTimeout(() => {
        if (!buttonRendered) {
          setShowSignInModal(true);
          inputValueRef.current = value;
        }
      }, 600); // 2000ms delay
    } else {
      setShowSignInModal(false);
      setButtonRendered(false);
    }
  };
    
  
    // Only proceed if the link is valid and the button hasn't been rendered yet
    // if (valid && !buttonRendered) {
    //   setShowSignInModal(true);
    //   inputValueRef.current = value;
    //   if (window.google && window.google.accounts && window.google.accounts.id) {
    //   } else {
    //     console.error("Google Identity services script not loaded.");
    //   }
    // } else {
    //   setShowSignInModal(false);
    //   setButtonRendered(false);
    // }
    
  const handleBack = () => {
    router.back(); // This will take the user to the previous page
  };

  return (
    <div className={styles.container}>
<button onClick={handleBack} className={styles.backButton}>←</button>
{showSignInModal && (
  <div className={styles.signInModal}>
    <p style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '1em' }}>Continue With Google</p>
    <span className={styles.closeButton} onClick={() => setShowSignInModal(false)}>&times;</span>
    <div id="signInDiv" className={styles.googleButton}></div>
    <footer className={styles.footer}>
      <a href="/terms-of-use" className={styles.footerLink}>Terms of Use</a> | 
      <a href="/privacy-policy" className={styles.footerLink}>Privacy Policy</a>
    </footer>
  </div>
  )}
      <Link href="/coursePage" passHref>
            <button className={styles.button}>
                <span></span>S
            </button>
        </Link>

    <div className={styles.centerWrapper}> {/* New wrapper for vertical centering */}
    <header className={styles.header}>
      <h1>Enter Your Referral Link</h1>
    </header>
    
    <div className={styles.refForm}> 
  <input
    type="text"
    placeholder="c9f746ae-b248-4850-8614-7cbbdf3faegc"
    value={inputValue}
    onChange={handleInputChange}
    className={`${styles.inputField} ${isValid ? styles.valid : isValid === false ? styles.invalid : ''}`}
  />
  {inputValue.length === 0 ? (
    <div className={styles.loadingIcon}></div>
  ) : isValid ? (
    <span className={styles.iconCheck}>✔</span>
  ) : (
    <span className={styles.iconClose}>❌</span>
  )}
</div>
    </div>
  </div>
  );

}

export default AccessPage;