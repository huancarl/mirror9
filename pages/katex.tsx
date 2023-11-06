import { useRef, useState, useEffect } from 'react';
import 'highlight.js/styles/github.css';
import React from "react";
import 'katex/dist/katex.min.css';
import { Typewriter } from './typewriter';  



export function messageContainsMath(message) {
  const latexPatterns = [
    /\$\$[\s\S]+?\$\$/,   // Extended display math
    /(?<!\\)\$.+?\$(?!\\)/, // Improved inline math
    /\\begin\{.+?\}[\s\S]*?\\end\{.+?\}/, // LaTeX environments
    /\\[a-zA-Z]+\[.*?\]\{.*?\}/, // Commands with optional arguments
    /\\[a-zA-Z]+(_\{.*?\}|\^\{.*?\})*/, // Commands with subscripts/superscripts
    /\\[a-zA-Z]+/,  // General LaTeX commands
    /\\[a-zA-Z]+\{([^{}]*\{.*?\})*.*?\}/, // Nested expressions
    /%.*?\$.*?\$/, // Detecting math in comments
    /\\[^a-zA-Z0-9]/ // Escaped characters
  ];

  for (let pattern of latexPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }
  return false;  // Ensures all code paths return a value.
}

  


export function transformMessageWithLatex(message) {
    let isInlineMath = message.startsWith('$') && message.endsWith('$');
    let isDisplayMath = message.startsWith('$$') && message.endsWith('$$');
  
    if (isInlineMath) {
      message = message.substring(1, message.length - 1);
    } else if (isDisplayMath) {
      message = message.substring(2, message.length - 2);
    }
  
    let transformedMessage = message;

    transformedMessage = transformedMessage.replace(/\\\[|\\\]/g, "$$");
  
    transformedMessage = transformedMessage.replace(/(\w+)\^(\w+)/g, '$1^{$2}');
    transformedMessage = transformedMessage.replace(/\b(sqrt|sin|cos|tan|log)\b/g, '\$1 ');
    transformedMessage = transformedMessage.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
    transformedMessage = transformedMessage.replace(/<=/g, '\\leq');
    transformedMessage = transformedMessage.replace(/>=/g, '\\geq');
    transformedMessage = transformedMessage.replace(/!=/g, '\\neq');
    transformedMessage = transformedMessage.replace(/(?<!\$)\$(?!\$)/g, '\\$');
  
    return transformedMessage;
  }



  
export function splitMessageIntoSegments(message) {
    const regex = /(\${1,2}.*?\${1,2})/g;
    return message.split(regex)
  }
  


  
export function MathComponent({ latex }) {
    const mathRef = useRef(null);
  
    useEffect(() => {
      if (window.katex && mathRef.current) {
        console.log("Rendering LaTeX: ", latex);
        window.katex.render(latex, mathRef.current);
      }
    }, [latex]);
  
    return <span ref={mathRef} />;
  }
  


  export function MessageRenderer({ message }) {
    const segments = splitMessageIntoSegments(message);
  
    return (
      <>
        {segments.map((segment, index) => {
          if (messageContainsMath(segment)) {
            const latexSegment = transformMessageWithLatex(segment);
            return <MathComponent key={index} latex={latexSegment} />;
          } else {
            const parsedBoldText = parseBoldText(segment);
            return <Typewriter key={index} message={parsedBoldText} />;
          }
        })}
      </>
    );
  }
  


  // For Bold Text

  export function parseBoldText(text) {
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }
