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
import katex from "katex";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { 
  messageContainsMath,
  MessageRenderer,
} from './katex';
import {
  messageContainsCode,
  transformMessageWithCode
} from './codeblock'
import Sidebar from 'components/Sidebar';
import { Typewriter } from './typewriter'; 
import { useRouter } from 'next/router';



declare global {
  interface Window {
    katex: any;
  }
}
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
  const [refreshKey, setRefreshKey] = useState(0);
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const userIDRef = useRef<string | null>(null);
  const sessionIDRef = useRef<string | null>(null);
  const [currentSessionID, setCurrentSessionID] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
 
  const router = useRouter();
  const courseTitle = router.query.course;

  useEffect(() => {
    async function fetchAllSessions() {
      try {
        const response = await fetch('/api/fetchAllSessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID: userIDRef.current,
          }),
        });
        const data = await response.json();
        if (data.error) {
          console.error("Failed to fetch sessions:", data.error);
        } else {
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error('An error occurred while fetching the sessions:', error);
      }
    }
    fetchAllSessions();
  }, [userIDRef.current]);

  const handleSessionChange = async (newSessionID: string) => {
    setCurrentSessionID(newSessionID);
  
  
    // Fetch chat history for newSessionID and update the messageState
    const fetchedMessages = await fetchChatHistoryForSession(newSessionID);
  
  
    // Assuming each fetched message has a format { message: '...', type: '...' }
    setMessageState(prevState => ({
        ...prevState,
        messages: fetchedMessages
    }));
  };
  
  
  const fetchChatHistoryForSession = async (sessionID: string) => {
    try {
        const response = await fetch('/api/fetchChatHistory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID: localStorage.getItem('lapp'),
                sessionID: sessionID
            }),
        });
        const data = await response.json();
        return data.messages || [];
    } catch (error) {
        console.error('Failed to fetch chat history:', error);
        return [];
    }
  };  

  useEffect(() => {
    function getOrGenerateUUID(key: string): string {
      let value = localStorage.getItem(key) || '';
      if (!value) {
          value = uuidv4();
          localStorage.setItem(key, value);
      }
      return value;
  }
  
    userIDRef.current = getOrGenerateUUID('lapp');
    sessionIDRef.current = getOrGenerateUUID('sapp');

    async function fetchChatHistory() {
      try {
        const response = await fetch('/api/fetchHistory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID: userIDRef.current,
            sessionID: sessionIDRef.current,
          }),
        });
        const data = await response.json();
        console.log(data, 'data from db');
  
        if (data.error) {
          console.error("Failed to fetch chat history:", data.error);
        } else {
          // Transform the retrieved data
          const transformedMessages = data.messages.flatMap(msg => ([
            {
              type: 'userMessage',
              message: msg.userQuestion,
            },
            {
              type: 'apiMessage',
              message: msg.answer,
              sourceDocs: msg.sourceDocs || [],
            }
          ]));
          transformedMessages.unshift({
            type: 'apiMessage',
            message: 'Hi, what would you like to learn today?'
          });
          setMessageState((state) => ({
            ...state,
            messages: transformedMessages,
          }));
          if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
          }
        }
      } catch (error) {
        console.error('An error occurred while fetching the chat history:', error);
      }
    }
    fetchChatHistory();
  }, [currentSessionID]);
  
//   const handleSessionChange = (newSessionID: string) => {
//     setCurrentSessionID(newSessionID);
// }


//********************************************************************************************************* */
  async function handleSubmit(e: any) {

    const namespaceToSearch: any = courseTitle;

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
        {
          type: 'apiMessage',
          message: `Searching ${namespaceToSearch}...`,
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
          userID: userIDRef.current,     
          sessionID: sessionIDRef.current, 
          namespace: namespaceToSearch
        }),
      });
      const data = await response.json();

      // console.log(messages, 'is messages');
      // console.log(data.sourceDocs, 'is sourceDocs');
      if (data.sourceDocs) {
        data.sourceDocs = data.sourceDocs.map(doc => {
          if (doc.text) {
            // Replace sequences of spaces with a single space
            doc.text = doc.text.replace(/\s+/g, ' ').trim();
          }
          return doc;
        });
      }

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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////////////////
  }
  return (
    <>
      <Layout>
      <div className="appWrapper">
      <aside> 
      <Sidebar onSessionChange={handleSessionChange} /> 
      </aside>
      <div className="mainContent" key={refreshKey}>
        <div className="mx-auto flex flex-col gap-4">
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
            CornellGPT Beta
          </h1>
          <h4 className={styles.selectedClassName}>{courseTitle}</h4> 
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>

                {messages.map((message, index) => {
    // Your message type handling logic 
    let icon;
    let className;
    let content;

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
        className = loading && index === messages.length - 1
            ? styles.usermessagewaiting
            : styles.usermessage;
    }

    const isCodeMessage = index > 0 && message.type === 'apiMessage' && messageContainsCode(messages[index - 1].message, message.message);

    if (isCodeMessage) {
      content = <CodeBlock key={index} code={transformMessageWithCode(message.message)} />;
  } else if (messageContainsMath(message.message)) {
      content = <MessageRenderer key={index} message={message.message} />;
  } else {
      if (message.type === 'apiMessage' && !isCodeMessage) {  
          content = <Typewriter message={message.message} />;
      } else {
          content = <span>{message.message}</span>;
      }
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
                    }>
                    {content}
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
                                    <a href={`/pdfs/${doc.Source.split('/').pop()}#page=${doc.Page_Number}`} target="_blank" rel="noopener noreferrer" 
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
                    maxLength={50000} // input size adjustment***
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
        </div>
        </div>
      </Layout>
    </>
  );
}