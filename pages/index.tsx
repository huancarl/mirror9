import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '@/styles/HomePage.module.css';
import useTypewriter from 'react-typewriter-hook'; // You need to install this package

const HomePage: React.FC = () => {
  const [magicName, setMagicName] = useState("Summarize lecture 5 in detail");
  const typewriter = useTypewriter(magicName);
  const index = useRef(0);
  const prompts = [
    "What is the grade breakdown?",
    "CS 2110: explain lecture 3",
    "When is the next prelim?",
    "What classes should I take for distributions?",
    "Generate practice prelim problems",
    "PSYCH 1101: summarize lecture 9 in detail",
    "Explain the main concepts from HW2",
    "What is the grade breakdown?",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      index.current = index.current >= prompts.length - 1 ? 0 : index.current + 1;
      setMagicName(prompts[index.current]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.typewriterContainer}>
        <div className={styles.typewriter}>
          {typewriter}
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <h1 className={styles.title}>
          <span style={{ color: 'hsl(0, 100%, 30%)' }}>Cornell</span>
          <span style={{ color: 'hsl(0, 100%, 30%)' }}>GPT</span>
        </h1>
        
        <Link href="/sign-up" passHref>
          <button className={styles.button}>
            <span>🐻</span>Sign Up
          </button>
        </Link>

        <Link href="/loginEmail" passHref>
          <button className={styles.loginButton}>
            <span>🐻</span>Log In
          </button>
        </Link>
      </div>
      <footer className={styles.footer}>
        <a href="/terms-of-use" className={styles.footerLink}>Terms of Use</a> | 
        <a href="/privacy-policy" className={styles.footerLink}>Privacy Policy</a>
        </footer>
    </div>
  );
}



export default HomePage;








