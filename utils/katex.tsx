import { useRef, useState, useEffect } from 'react';
import 'highlight.js/styles/github.css';
import React from "react";
import 'katex/dist/katex.min.css';
import { Typewriter } from './typewriter';


export function validateAndTransformLatex(latex) {
  // Add any specific validation logic here
  // For now, let's just return the transformed LaTeX if it's valid
  // and null if it's not
  try {
    return transformMessageWithLatex(latex);
  } catch (error) {
    console.error('Invalid LaTeX syntax:', error);
    return null;
  }
}

export function messageContainsMath(message) {
  const latexPatterns = [
    /^\$\$[\s\S]+?\$\$$/, // Display math: $$...$$
    /^\$[^\s].+[^\s]\$$/, // Inline math: $...$ (non-whitespace at both ends)
    /^\\begin\{.+?\}[\s\S]+?\\end\{.+?\}$/, // Environments: \begin{...}...\end{...}
    /(?<!\\)\$[^\s\$]*[a-zA-Z0-9=+\-*/\\_^\[\]{}()|.,;:'"`<>]+\S*?\$(?!\$)/, // More specific inline math
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

  // Adjustments for LaTeX syntax
  transformedMessage = transformedMessage.replace(/\\\[|\\\]/g, "$$"); // Replaces \[ and \] with $$
  transformedMessage = transformedMessage.replace(/\\\( | \\\)/g, '$'); // Replaces \( and \) with $
  transformedMessage = transformedMessage.replace(/(\w+)\^(\w+)/g, '$1^{$2}');
  transformedMessage = transformedMessage.replace(/\b(sqrt|sin|cos|tan|log)\b/g, '\\$1 ');
  transformedMessage = transformedMessage.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
  transformedMessage = transformedMessage.replace(/<=/g, '\\leq');
  transformedMessage = transformedMessage.replace(/>=/g, '\\geq');
  transformedMessage = transformedMessage.replace(/!=/g, '\\neq');
  transformedMessage = transformedMessage.replace(/(?<!\$)\$(?!\$)/g, '\\$');
  transformedMessage = transformedMessage.replace(/[“”]/g, '"'); // Fix for typographic quotes
  transformedMessage = transformedMessage.replace(/%(?!\n)/g, '\\%');

  return transformedMessage;
}

export function splitMessageIntoSegments(message: string): string[] {
  const segments: string[] = [];
  let lastIndex = 0;

  // Regex for identifying LaTeX patterns
  const regex = /(\$\$[\s\S]+?\$\$|(?<!\\)\$[^\s\$]*[a-zA-Z0-9=+\-*/\\_^\[\]{}()|.,;:'"`<>]+\S*?\$(?!\$)|\\begin\{.+?\}[\s\S]*?\\end\{.+?\})/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    // Push preceding non-math text if any
    if (match.index > lastIndex) {
      segments.push(message.slice(lastIndex, match.index));
    }
    // Push math segment
    segments.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  // Push remaining non-math text if any
  if (lastIndex < message.length) {
    segments.push(message.slice(lastIndex));
  }

  return segments;
}


export function MathComponent({ latex }) {
  const mathRef = useRef(null);

  useEffect(() => {
    try {
      if (window.katex && mathRef.current) {
        window.katex.render(latex, mathRef.current, {
          throwOnError: false // This will render the raw string on error instead of throwing an exception
        });
      } 
    } catch (error) {
      console.error(error);
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
          return <Typewriter key={index} message={parsedBoldText} animate={true} />;
        }
      })}
    </>
  );
}

// For Bold Text

export function parseBoldText(text) {
  if (typeof text !== 'string' && !text) {
    return [];
  }

  return text.split(/(\*\*.*?\*\*)|(%%.*?%%)/g).map((part, index) => {
    if (part && part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    else if (part && part.startsWith('%%') && part.endsWith('%%')) {

      const sourcePageRegex = /%%Source: (.*?) Page: (\d+)%%/;
      const match = sourcePageRegex.exec(part);
      if (match) {
        const [_, source, page] = match;
        const url = `/pdf/${source}`; // Construct the URL

        const filename = url.split('/').pop();

        return <a key={index} href={url+`#page=${page}`} target="_blank" rel="noopener noreferrer"
        style={{
          textDecoration: 'underline',
          cursor: 'pointer',
          fontWeight: 625}}>{filename}</a>;
      }

    }
    return <span key={index}>{part}</span>; // Convert string parts to text nodes
  });
}
