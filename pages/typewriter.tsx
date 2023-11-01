import React, { useEffect, useState } from 'react';
import styles from './Typewriter.module.css';
import { 
  messageContainsMath,
  MessageRenderer,
  transformMessageWithLatex
  
} from './katex';

interface TypewriterProps {
  message: any;
  speed?: number;
}

export const Typewriter: React.FC<TypewriterProps> = ({ message = '', speed = 8.0 }) => {
  const [currentText, setCurrentText] = useState<string>('');
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    if (message && index < message.length) { // checking if message is defined and not null
      const timer = setTimeout(() => {
        setCurrentText((prevText) => prevText + message.charAt(index));
        setIndex((prevIndex) => prevIndex + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [index, message, speed]);

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



