import '@/styles/base.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <main className={inter.variable}>
        <Script defer src="https://cdn.jsdelivr.net/npm/katex@0.13.18/dist/katex.min.js" />
        <Component {...pageProps} />
      </main>
    </>
  );
}

export default MyApp;


