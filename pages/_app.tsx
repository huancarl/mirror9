import '@/styles/base.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
    <Elements stripe={stripePromise}>
      <main className={inter.variable}>
        <Script defer src="https://cdn.jsdelivr.net/npm/katex@0.13.18/dist/katex.min.js" />
        <Component {...pageProps} />
      </main>
      </Elements>
    </>
  );
}

export default MyApp;


