import { useRef, useState, useEffect } from 'react';
import 'highlight.js/styles/github.css';
import React from "react";
import katex from "katex";
import 'katex/dist/katex.min.css';


export function messageContainsMath(message) {

    const latexPatterns = [

      /\$\$.+?\$\$/,   // Checks for display math (between $$ and $$)
      /(?<![a-zA-Z])\$.+?\$(?![a-zA-Z])/, // Checks for inline math (between $ and $) that's not part of a word
      /\\[a-z]+\{.+?\}/, // Checks for common LaTeX commands like \frac{1}{2}
      /\\[a-z]+/,  // Checks for common LaTeX commands without braces like \int or \sin
  
    ];

    for (let pattern of latexPatterns) {
      if (pattern.test(message)) {
        return true;
      }
    }
    return false;  // Added to ensure all code paths return a value.
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
    return message.split(regex);
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
                    return <span key={index}>{segment}</span>;
                }
            })}
        </>
    );
  }
