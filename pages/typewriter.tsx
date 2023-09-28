import React, { useEffect, useState } from 'react';

interface TypewriterProps {
  message: any;
  speed?: number;
}

export const Typewriter: React.FC<TypewriterProps> = ({ message = '', speed = 4 }) => {
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


