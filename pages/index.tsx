import React from 'react';
import Link from 'next/link';
import styles from '@/styles/HomePage.module.css';

const HomePage: React.FC = () => {
    return (

        <div className={styles.container}>
            <h1 className={styles.title}>
            <span style={{ color: 'hsl(0, 100%, 30%)' }}>Cornell</span>
                <span style={{ color: 'black' }}>GPT</span>
            </h1>
            
        <Link href="/redeem" passHref>
            <button className={styles.button}>
                <span>➔</span>Sign Up
            </button>
        </Link>

        <Link href="/loginEmail" passHref>
            <button className={styles.loginButton}>
                <span>➔</span>Log In
            </button>
        </Link>

        </div>
    );
}

export default HomePage;







