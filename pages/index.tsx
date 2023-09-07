import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/ui/accordion';
import React from "react";
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: any;
  }>({
    messages: [
      {
        message: 'Hi, what would you like to learn today?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const userIDRef = useRef<string | null>(null);
  const sessionIDRef = useRef<string | null>(null);

  useEffect(() => {
    textAreaRef.current?.focus();

    // Handle userID
    let localUserID = localStorage.getItem('lapp');
    if (!localUserID) {
        localUserID = uuidv4();
        localStorage.setItem('lapp', localUserID);
    }
    userIDRef.current = localUserID;

    // Handle sessionID
    let localSessionID = localStorage.getItem('sapp');
    if (!localSessionID) {
        localSessionID = uuidv4();  // Only create a new sessionID if none exists
        localStorage.setItem('sapp', localSessionID);
    }
    sessionIDRef.current = localSessionID;
    console.log(userIDRef);
    console.log(sessionIDRef);
}, []);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

//********************************************************************************************************* */
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }
    
    const question = query.trim();
    console.log('Sending question:', question);

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
        }),
      });
      const data = await response.json();

      console.log(messages, 'is messages');
      console.log(data.sourceDocs, 'is sourceDocs');
      

      if (data.error) {
        setError(data.error);
      } else {

        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.message,
              sourceDocs: data.sourceDocs,
              // sourceDocs: data.sourceDocs,
              // message: data.text,
              // sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.message ]],
        }));
      }
      console.log('messageState', messageState);

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }
//*************************************************************************************************************** */
  //prevent empty submissions

  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }

  };

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function messageContainsMath(message) {
  const containsLatexURL = message.includes('https://latex.codecogs.com/png.image?');
  if (containsLatexURL) return false;

  const mathPatterns = [
    /\d+/,
    /[+\-*/^]/,
    /\b(sqrt|sin|cos|tan|log)\b/,
    /[a-zA-Z]\d*/,
    /(\d+\/\d+)/,
    /[a-zA-Z]=/,
    /\b(pi|e|phi|theta|sigma)\b/,
    /<=|>=|!=/,
  ];

  return mathPatterns.some(pattern => pattern.test(message));
}


function hasBalancedBraces(expression: string): boolean {
  let stack: string[] = [];
  for(let char of expression) {
      if(char === '{') stack.push(char);
      else if(char === '}') {
          if(stack.length === 0) return false;
          stack.pop();
      }
  }
  return stack.length === 0;
}

const symbolToLatex = {
  'α': '\\alpha',
  'β': '\\beta',
  'γ': '\\gamma',
  'δ': '\\delta',
  'ε': '\\epsilon',
  'ζ': '\\zeta',
  'η': '\\eta',
  'θ': '\\theta',
  'ι': '\\iota',
  'κ': '\\kappa',
  'λ': '\\lambda',
  'μ': '\\mu',
  'ν': '\\nu',
  'ξ': '\\xi',
  'ο': '\\omicron',  // Note: Rarely used in math notation
  'π': '\\pi',
  'ρ': '\\rho',
  'σ': '\\sigma',
  'τ': '\\tau',
  'υ': '\\upsilon',
  'φ': '\\phi',
  'χ': '\\chi',
  'ψ': '\\psi',
  'ω': '\\omega',
  '∫': '\int',
  
  
};




function transformMessageWithLatex(message) {
  let transformedMessage = message;
  
  transformedMessage = transformedMessage.replace(/(\w+)\^(\w+)/g, '$1^{$2}');
  transformedMessage = transformedMessage.replace(/\b(sqrt|sin|cos|tan|log)\b/g, '\\$1 ');
  transformedMessage = transformedMessage.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
  transformedMessage = transformedMessage.replace(/\b(pi|e|phi|theta|sigma|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/g, '\\$1 ');
  transformedMessage = transformedMessage.replace(/<=/g, '\\leq');
  transformedMessage = transformedMessage.replace(/>=/g, '\\geq');
  transformedMessage = transformedMessage.replace(/!=/g, '\\neq');
  
  for (let symbol in symbolToLatex) {
    const regex = new RegExp(symbol, 'g');
    transformedMessage = transformedMessage.replace(regex, symbolToLatex[symbol]);
  }

  if(!hasBalancedBraces(transformedMessage)) {
      console.error("Braces are not balanced:", transformedMessage);
      return null; // or however you want to handle this
  }
  transformedMessage = transformedMessage.replace(/\\piT/g, '\\pi T');
  transformedMessage = transformedMessage.replace(/d([a-zA-Z])/g, '\\mathrm{d}$1');
  
  return transformedMessage;
}


function generateLatexURL(latexExpression) {
  if (!latexExpression) {
      console.error("No LaTeX expression provided.");
      return;
  }

  try {
      const encodedExpression = encodeURIComponent(latexExpression);
      const url = `https://latex.codecogs.com/png.image?${encodedExpression}`;

      // Simple validation; you can expand this
      if (url.length > 2000) { // Most browsers have a URL limit of around 2000 characters
          console.error("Generated LaTeX URL is too long:", url);
          return;
      }

      return url;
  } catch (error) {
      console.error("Error generating LaTeX URL:", error);
  }
}


function transformMathToLatexURL(message) {
  let modifiedMessage = message;
  
  let stack: string[] = [];
  let startPos = -1;

  for(let i = 0; i < message.length; i++) {
    if(message[i] === '{') {
      stack.push('{');
      if(startPos === -1) startPos = i;
    } else if(message[i] === '}') {
      stack.pop();
      if(stack.length === 0 && startPos !== -1) {
        const segment = message.substring(startPos + 1, i);
        const latexMessage = transformMessageWithLatex(segment);
        const latexURL = generateLatexURL(latexMessage);

        if (!latexURL) {
          console.warn(`Unable to generate LaTeX URL for segment: ${segment}`);
          continue;
        }

        const imgTag = `<img src="${latexURL}" alt="LaTeX Expression" style="margin: 0; padding: 0; display: inline-block;"/>`; 
        modifiedMessage = modifiedMessage.replace(`{${segment}}`, imgTag);

        startPos = -1; // reset
      }
    }
  }

  return modifiedMessage;
}



  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function messageContainsCode(message:any, userMessage:any) {
    const codeKeywords = [

      'python', 'java', 'javascript', 'typescript', 'OCaml','SQL','Swift','Perl','PHP',
      'typescript','HTML','C',"C++",'MATLAB','C#','Julia','Rust'

    ];

    const isQuestionCodeRelated = codeKeywords.some(keyword => message.includes(keyword));
    const isAnswerCodeRelated = codeKeywords.some(keyword => userMessage.includes(keyword));
  
    return isQuestionCodeRelated && isAnswerCodeRelated;
  }

function transformMessageWithCode(message: any) {
    const codeKeywords = [

      'python', 'java', 'javascript', 'typescript', 'OCaml','SQL','Swift','Perl','PHP',
      'typescript','HTML','C',"C++",'MATLAB','C#','Julia','Rust'

    ];
  
  const segments = message.split('`');
  // Transform code segments
  for (let i = 1; i < segments.length; i += 2) {
    if (codeKeywords.some(keyword => segments[i].includes(keyword))) {
      segments[i] = `\`\`\`\n${segments[i]}\n\`\`\``; // Convert single backticks to triple for block code
    }
  }
  
  return segments.join('');
}

  function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
  
    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
  
    return (
      <div className={styles.codeBlock}>
        <pre className={styles.code}>
        <code style={{ color: "#8B0000" }}>{code}</code>
        </pre>
        <button
          className={styles.copyButton}
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? 'Copied🐻' : 'Copy'}
        </button>
      </div>
    );
  }
  return (
    <>
      <Layout>
        <div className="mx-auto flex flex-col gap-4">
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
            CornellGPT Beta
          </h1>
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>

                {messages.map((message, index) => {

const isCodeMessage = index > 0 && message.type === 'apiMessage' && messageContainsCode(messages[index - 1].message, message.message);
const containsMathSegment = messageContainsMath(message.message);
let transformedMessage;

if (isCodeMessage) {
  transformedMessage = transformMessageWithCode(message.message);
} else if (containsMathSegment) {
  transformedMessage = transformMathToLatexURL(message.message);
} else {
  transformedMessage = message.message;
}
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/big-red-bear.jpeg"
                        alt="AI"
                        width="50"
                        height="50"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/usericon.png"
                        alt="Me"
                        width="45"
                        height="45"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <>
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        
                        
<div className={styles.markdownanswer}
    style={
        isCodeMessage ? {
            backgroundColor: "#f5f5f5",
            padding: "10px",
            borderRadius: "5px",
            display: "block",
            margin: "1em 0",
            border: "1px solid #ddd",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            fontFamily: "'Courier New', monospace",
            fontSize: "14px",
            color: "black",
            lineHeight: "1.4",
        } : {}
        
    }        
>
{isCodeMessage ? (
    <CodeBlock code={transformedMessage} />
) : containsMathSegment ? (
<div dangerouslySetInnerHTML={{ __html: transformedMessage }} />
) : (
    <ReactMarkdown linkTarget="_blank">
        {transformedMessage}
    </ReactMarkdown>
)}
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc: any, index) => (
                              <div key={`messageSourceDocs-${index}`}> 
                              {/* //look at this section */}
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.text}
                                    </ReactMarkdown>
                                    <p className="mt-2">
                                    <b>Source: </b> 
                                    <a href={`/pdfs\${doc.Source.split('\').pop()}#page=${doc.Page_Number}`} target="_blank" rel="noopener noreferrer" 
                                    style={{
                                      color: 'red',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      fontWeight: 625
                                  }}>
                                    {doc.Source.split('/').pop()}
                                    </a>

                                    </p>
                                    <p>
                                      <b> Page number: </b> {doc.Page_Number}
                                    </p>
                                    <p>
                                      <b> Total Pages: </b> {doc.Total_Pages}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={5000} // input size adjustment***
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Retrieving...'
                        : 'Send a message :)'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div>
        <footer className="m-auto p-4">
          <a href="Carl Huang and Mith Patel">
          </a>
        </footer>
      </Layout>
    </>
  );
}