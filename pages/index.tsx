import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '@/styles/HomePage.module.css';
import useTypewriter from 'react-typewriter-hook'; // You need to install this package
import { useRouter } from 'next/router';
import { isAuthenticated, withSession } from 'utils/session';
import { Analytics } from "@vercel/analytics/react"

export const getServerSideProps = withSession(async ({ req, res }) => {
  const user = await isAuthenticated(req);

  if (user) {
      return {
          redirect: {
              destination: '/coursePage', // Redirect to the sign-in page
              permanent: false,
          },
      };
  }
  // User is authenticated
  return { props: { user } };
});


const HomePage: React.FC = () => {
  const [magicName, setMagicName] = useState("Explain lecture 21 in detail");
  const typewriter = useTypewriter(magicName);
  const index = useRef(0);
  const prompts = [
    "How much is the final worth?",
    "CS 2110: explain dijkstra's algorithm",
    "When is the next prelim?",
    "CHEM 2090: explain the second lab",
    "What diversity classes should I take?",
    "Generate practice prelim problems",
    "INFO 2950: explain Naive Bayes",
    "Explain how to do problem 1 from HW2",
  ];

  useEffect(() => {
    
    const interval = setInterval(() => {
      index.current = index.current >= prompts.length - 1 ? 0 : index.current + 1;
      setMagicName(prompts[index.current]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  
// git test git test

// test test

  

  return (
    <div className={styles.container}>
      <Analytics />{}



      <div className={styles.typewriterContainer}>
        <div className={styles.typewriter}>
          {typewriter}
        </div>
        <img src='/openpoop.png' alt="OpenAI Logo" className={styles.openAILogo} />
      </div>

      <div className={styles.buttonContainer}>
        <h1 className={styles.title}>
          <span style={{ color: 'white' }}>Cornell</span>
          <span style={{ color: 'white' }}>GPT</span>
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
      <a href="https://mountain-pig-87a.notion.site/Terms-Of-Use-CornellGPT-96c16de16cc94ff5b574fb4632b069e9" className={styles.footerLink} target="_blank">Terms of Use</a> |
        <a href="https://mountain-pig-87a.notion.site/Privacy-Policy-CornellGPT-6f20ea4c7a7741eabe19bfee5004a069" className={styles.footerLink} target="_blank">Privacy Policy</a>
        </footer>

    </div>
  );
}



export default HomePage;








