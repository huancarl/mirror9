import React, { useState } from 'react';
import styles from '@/styles/Redeem.module.css';
import Link from 'next/link';

function AccessPage() {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(null);

  // This function simulates an API call
  const verifyLink = async (link) => {

    // Placeholder for actual verification logic

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

  const handleInputChange = async (event) => {
    const value = event.target.value;
    setInputValue(value);

    // Since verifyLink is an async function, you need to await its result
    const valid = await verifyLink(value); // Add await here
    setIsValid(valid);
  };

  return (
    <div className={styles.container}>
      <Link href="/coursePage" passHref>
            <button className={styles.button}>
                <span>➔</span>Sign Up
            </button>
        </Link>
    <div className={styles.centerWrapper}> {/* New wrapper for vertical centering */}
    <header className={styles.header}>
      <h1>Enter Your Referral Link :)</h1>
    </header>
      <div className={styles.refForm}> 
      <input
        type="text"
        placeholder="Enter the link here"
        value={inputValue}
        onChange={handleInputChange}
        className={`${styles.inputField} ${isValid ? styles.valid : isValid === false ? styles.invalid : ''}`}
      />
      {isValid && <span className={styles.iconCheck}>✓</span>}
        {isValid === false && <span className={styles.iconClose}>✕</span>}
      </div>
    </div>
  </div>
  );

}

export default AccessPage;