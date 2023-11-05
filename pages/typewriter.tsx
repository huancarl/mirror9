import React, { useEffect, useState } from 'react';

interface TypewriterProps {
  message: (string | React.ReactNode)[];
  speed?: number; // Speed in milliseconds
}

export const Typewriter: React.FC<TypewriterProps> = ({ message = [], speed = 3.0 }) => {
  const [currentText, setCurrentText] = useState<React.ReactNode[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [charIndex, setCharIndex] = useState<number>(0);

  useEffect(() => {
    const currentMessage = message[index];

    if (typeof currentMessage === 'string') {
      if (charIndex < currentMessage.length) {
        const timer = setTimeout(() => {
          setCurrentText((prevText) => [...prevText, currentMessage.charAt(charIndex)]);
          setCharIndex(charIndex + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else if (index < message.length - 1) {
        setIndex(index + 1);
        setCharIndex(0);
      }
    } else if (index < message.length) {
      setCurrentText((prevText) => [...prevText, currentMessage]);
      setIndex(index + 1);
    }
  }, [index, charIndex, message, speed]);

  return <>{currentText}</>;
};





// interface TypewriterProps {
//   message: string;
//   speed?: number;
//   cursor?: boolean;
//   onComplete?: () => void;
// }

// export const Typewriter: React.FC<TypewriterProps> = ({
//   message = '',
//   speed = 7,
//   cursor = true,
//   onComplete
// }) => {
//   const [currentText, setCurrentText] = useState<string>('');
//   const [index, setIndex] = useState<number>(0);

//   useEffect(() => {
//     if (message && index < message.length) { 
//       const timer = setTimeout(() => {
//         setCurrentText((prevText) => prevText + message.charAt(index));
//         setIndex((prevIndex) => prevIndex + 1);
//       }, speed);
//       return () => clearTimeout(timer);
//     } else if (index === message.length && onComplete) {
//       onComplete();
//     }
//   }, [index, message, speed, onComplete]);

//   return <span>{currentText}{cursor && <span className={styles.cursor}>|</span>}</span>;
// };



