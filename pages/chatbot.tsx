import { useRef, useState, useEffect } from 'react';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
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

import { 
  messageContainsMath,
  MessageRenderer,
  parseBoldText,
  
} from '../utils/katex';


// #1
import {
  messageContainsCode,
  transformMessageWithCode
} from '../utils/codeblock'


import Sidebar from 'components/Sidebar';
import { Typewriter } from '../utils/typewriter'; 
import { useRouter } from 'next/router';
import "prismjs/themes/prism-tomorrow.css"; // You can choose different themes
import useTypewriter from 'react-typewriter-hook'; // You need to install this package

import MessageLimitModal from 'components/MessageLimitModal'; 
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // Import the style you want to use
import python from 'highlight.js/lib/languages/python';
import {withSession, isAuthenticated} from 'utils/session';
import app from 'config/firebase-config'; 



//Make sure that the page cannot be accessed without logging in
export const getServerSideProps = withSession(async ({ req, res }) => {
  const user = await isAuthenticated(req);

  if (!user) {
      return {
          redirect: {
              destination: '/loginEmail', // Redirect to the sign-in page
              permanent: false,
          },
      };
  }

  // User is authenticated
  return { props: { user } };
});





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
    messages: [],
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
  const [courseTitle, setCourseTitle] = useState<string | string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseHistoryRefreshKey, setCourseHistoryRefreshKey] = useState(0);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);

  const [firstMessageSent, setFirstMessageSent] = useState(false);


    // Implement Firebase Realtime Database logic here
    // useEffect(() => {
    //   const messagesRef = app.ref('messages');
  
    //   // Listen for real-time updates
    //   messagesRef.on('value', (snapshot) => {
    //     const data = snapshot.val();
    //     if (data) {
    //       // Update your state or perform other actions with the data
    //       console.log(data);
    //     }
    //   });
  
    //   // Clean up
    //   return () => messagesRef.off();
    // }, []);

  

  //Stripe set up
  const [stripePromise, setStripePromise] = useState<Stripe | null>(null);

  const [clientSecret, setClientSecret] = useState("");
  // const appearance = {
  //   theme: 'stripe',
  // };
  const options = {
    clientSecret,
  };
  useEffect(() => {
    const initializeStripe = async () => {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      setStripePromise(stripe);
    };

    initializeStripe();
  }, []);


  //Get the class the user has selected
  const router = useRouter();
  useEffect(() => {
    if (router.query.course) {
        setCourseTitle(router.query.course);
        setIsLoading(false); // set loading to false when course is set
    }
}, [router.query.course]);

const handleBackClick = (e) => {
  e.preventDefault();
  router.back();
};



  const [showMoreSources, setShowMoreSources] = useState(false); // Show More Sources


  const handleSessionChange = async (newSessionID: string) => {
    setCurrentSessionID(newSessionID);
    // Fetch chat history for newSessionID and update the messageState
    if(courseTitle){
      setMessageState(prevState => ({ ...prevState, messages: [] }));
      await fetchChatHistory();
    }
    // Note: If you're directly updating the messages within fetchChatHistory, 
    // you may not need additional logic here to update the message state.
};

  useEffect(() => {
    if(courseTitle){
      fetchChatHistory();
    }

  }, [courseTitle]);

  function getOrGenerateUUID(key: string): string {
    let value = localStorage.getItem(key) || '';
    if (!value) {
        value = uuidv4();
        localStorage.setItem(key, value);
    }
    return value;
  }
  
  
  const fetchChatHistory = async () => {

    //Initalizes the page with the chat history and with a stripe payment intent

    const sessionRes = await fetch('/api/userInfo');
    const sessionData = await sessionRes.json();
    if (sessionRes.ok) {
        // Set userID to the user's email from the session
        userIDRef.current = sessionData.email;
    } else {
        // Handle the case where the session is not available
        console.error('Session not found:', sessionData.error);
        return;
    }

    //Get the setupintent for stripe in case of payment
    fetch("/api/create-setup-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail: userIDRef.current})
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      });

    
    sessionIDRef.current = getOrGenerateUUID('sapp');
    try {
        //handling the edge case where you switch between course
        let response = await fetch('/api/getDocumentBySess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sapp: sessionIDRef.current,
            }),
        });
        const docData = await response.json();

        // 2. Compare 'course' field with currentTitle.
        const currentTitle = courseTitle; 

        if (docData.course !== currentTitle) {

            response = await fetch('/api/getLatestSess', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  course: currentTitle,  // add this line
                  userID: userIDRef.current,
              })
          });

            if(response.ok){
              const latestChatData = await response.json();
              const newSappValue = latestChatData.sessionID;

            // Update the 'sapp' in localStorage and sessionIDRef.
              localStorage.setItem('sapp', newSappValue);
              sessionIDRef.current = newSappValue;
            }
            else{
              const errorText = await response.text();
              console.error("Error:", errorText);
            }
          }
        // Now fetch the chat history using the (possibly updated) sessionIDRef value.
        response = await fetch('/api/fetchHistory', {
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

        if (data.error) {
            console.error("Failed to fetch chat history:", data.error);
        } else {
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
          // transformedMessages.unshift({
          //   type: 'apiMessage',
          //   message: 'Hi, what would you like to learn today?'
          // });

          setMessageState((state) => ({
            ...state,
            messages: transformedMessages,  // Ensure old messages are replaced, not appended
          }));
          if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
          }
        }
    } catch (error) {
        console.error('An error occurred while fetching the chat history:', error);
    }
};







//********************************************************************************************************* */

const handleCloseModal = () => {
  setShowLimitReachedModal(false);
  setLoading(false); // Ensure loading is also set to false if needed
  // Any other state resets if necessary
};

async function handleSubmit(e: any) {
  const namespaceToSearch: any = courseTitle;

  e.preventDefault();
  setError(null);

  if (!query) {
    alert('Its blank! Enter a question lol');
    return;
  }

  

  const isFirstMessage = messages.length === 0;
  if (isFirstMessage) {
    // Handle the first user message differently if needed
    // For example, set a welcome message or trigger a specific API call
    // If no special handling is required, you can leave this block empty
  }

  const question = query.trim();
  console.log('Sending question:', question);
  console.log(messageState.messages, 'message state');

  setMessageState(prevState => ({
    ...prevState,
    messages: [
      ...prevState.messages,
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
        messages: messageState.messages,
        userID: userIDRef.current,
        sessionID: sessionIDRef.current,
        namespace: namespaceToSearch,
      }),
    });
    const data = await response.json();

    if(data.message === 'User has exceeded their limit for messages'){
      //update state
      setShowLimitReachedModal(true);
      setQuery('');
      setLoading(false);
    }
    else{
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
        if (!data.error) {
          // Update the state to replace the last message with the actual API response
          setMessageState(prevState => {
            const newMessages = [ ...prevState.messages];
            newMessages[newMessages.length] = {
              type: 'apiMessage',
              message: data.message,
              sourceDocs: data.sourceDocs,
            };
            return {
              ...prevState,
              messages: newMessages,
              history: [...prevState.history,   [question, data.message]],
            };
          });
        }}
        setLoading(false);
        //scroll to bottom
        messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    }
  } catch (error) {
    setLoading(false);
    setError('An error occurred while fetching the data. Please try again.');
  }
}


const [magicName, setMagicName] = useState("CornellGPT");
const [typewriterPrompts, setTypewriterPrompts] = useState<string[]>(["CornellGPT"]);
const index = useRef(0);

let typewriter = useTypewriter(magicName);

// Update typewriterPrompts when courseTitle changes
useEffect(() => {
  // Handle both string and array types for courseTitle
  const newTitles = Array.isArray(courseTitle) ? courseTitle : [courseTitle];
  setTypewriterPrompts(prevPrompts => {
    // Merge newTitles with prevPrompts, filtering out any duplicates and null values
    const updatedPrompts = [...prevPrompts, ...newTitles].filter((title): title is string => title !== null);
    return [...new Set(updatedPrompts)];
  });
}, [courseTitle]);

useEffect(() => {
  const interval = setInterval(() => {
    index.current = index.current >= typewriterPrompts.length - 1 ? 0 : index.current + 1;
    setMagicName(typewriterPrompts[index.current]);
  }, 3000); // Rotate message every 5 seconds

  return () => clearInterval(interval);
}, [typewriterPrompts]);

// ... rest of your component




//*************************************************************************************************************** */
  //prevent empty submissions

  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault(); // Prevent the default action (newline)
  
        if (textAreaRef.current) {
          const start = textAreaRef.current.selectionStart;
          const end = textAreaRef.current.selectionEnd;
          const value = textAreaRef.current.value;
          
          // Create the updated text with indentation
          const indent = "                                                                                                                                                                              "; // Two spaces for indentation
          const before = value.substring(0, start);
          const after = value.substring(end);
          const newValue = before + indent + after;
          
          setQuery(newValue); // Update the state
  
          // Move the cursor after the indentation
          setTimeout(() => {
            if (textAreaRef.current) { // Check again for TypeScript
              textAreaRef.current.selectionStart = start + indent.length;
              textAreaRef.current.selectionEnd = start + indent.length;
              textAreaRef.current.focus();
            }
          }, 0);
        }
      } else if (!e.shiftKey && query.trim()) {
        handleSubmit(e);
      }
    }
  };
  

  const [placeholderText, setPlaceholderText] = useState('Message CornellGPT');
  const namespaceToSearch = courseTitle;

  // Function to get placeholders based on the namespace
  const getPlaceholders = (namespace) => {
    if (namespace === 'Course Finder SP24') {
      return [
        'What are the prereqs for MATH 2210?...',
        'Name 5 info science classes I can take...',
        'Can I take CS 2110 without CS 1110?...',
        'When is lecture for Human Bonding?...',
      ];
    } else {
      return [
        'explain lecture 5 in detail...',
        'explain page 4 in lecture 2',
        'what is the grade breakdown?...',
        'when are the professors office hours?...',
        'summarize lecture 20...',
        'explain the course overview...'
      ];
    }
  };

  useEffect(() => {
    const placeholders = getPlaceholders(namespaceToSearch);
    let placeholderIndex = 0;

    const intervalId = setInterval(() => {
      setPlaceholderText(placeholders[placeholderIndex]);
      placeholderIndex = (placeholderIndex + 1) % placeholders.length;
    }, 2000);

    return () => clearInterval(intervalId);
  }, [namespaceToSearch]);

  
  
  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////











// #2
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


    







    
  }

  return (
    <>
    {showLimitReachedModal && stripePromise && (
        <Elements stripe={stripePromise} options={ options }>
          <MessageLimitModal setShowLimitReachedModal={handleCloseModal} clientS={clientSecret}/>
        </Elements>
      )}
    <div className="appWrapper">
  <aside> 
    {courseTitle ? 
      <Sidebar className={courseTitle} onSessionChange={handleSessionChange} onNewChat={handleSessionChange} /> 
      : null}
  </aside>

  <button
    className={styles.classInquiryButton}
    onClick={() => window.open('https://forms.gle/Gz6Th57GLCa6y2jR6', '_blank')}
  >
    UPLOAD MATERIALS
  </button>

  <div className="mainContent" key={refreshKey}>
    <div className="mx-auto flex flex-col gap-4">
    <div className="headerSection" style={{ marginLeft: '130px', marginTop: '10px' }}>  
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tighter text-center">
        {messages.length > 0 && (
                <span className={styles.selectedClassName}>{courseTitle}</span>
              )}
        </h1>
      </div>
          <main className={styles.main}>
          {messages.length === 0 && (
                <div className={styles.typewriterContainer}>
                  <div className={styles.typewriter}>
                    {typewriter}
                  </div>
                </div>
              )}
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
                src="/bigbear234.png"
                alt="AI"
                width="50"
                height="45"
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
                width="35"
                height="25"
                className={styles.usericon}
                priority
            />
        );
        className = loading && index === messages.length - 1
            ? styles.usermessagewaiting
            : styles.usermessage;
    }






// #3
const isCodeMessage = message.message.includes('```') || message.message.includes('`') || message.message.includes('``'); 
//
const isLatestApiMessage = index === messages.length - 1 && message.type === 'apiMessage';
const handleBack = () => {
  router.back(); // This will take the user to the previous page
};

  if (messageContainsMath(message.message)) {
    content = <MessageRenderer key={index} message={message.message} />;
  // #4
  } else if (isCodeMessage) {
    content = transformMessageWithCode(message.message);
  //
  } else if (message.type === 'apiMessage') {                        
    content = <Typewriter key={index} message={parseBoldText(message.message)} animate={isLatestApiMessage} />;
  } else {
    content = <span>{parseBoldText(message.message)}</span>;
  }



    if (isLoading) {
      return <>Loading...</>;
    }   
    return (
        <>
        <button onClick={handleBack} className={styles.backButton}>←</button>
            <div key={`chatMessage-${index}`} className={className}>
                {icon}
                <div className={isCodeMessage ? styles.chatCodeBlock : styles.markdownanswer}>
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
                            {message.sourceDocs.slice(0, showMoreSources ? message.sourceDocs.length : 1).map((doc: any, index) => (
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
                                    <a href={`/pdf/${doc.Source.split('/').pop()}#page=${doc.Page_Number}`} target="_blank" rel="noopener noreferrer" 
                                    style={{
                                      color: 'blue',
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



 {message.sourceDocs.length > 2 && !showMoreSources && (
  <button className="p-2 text-sm text-red-500" onClick={() => setShowMoreSources(true)}>
    Show All
  </button>
)}
{showMoreSources && (
  <button className="p-2 text-sm text-red-500" onClick={() => setShowMoreSources(false)}>
    Show Less
  </button>
)}   
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
      <a href="https://mountain-pig-87a.notion.site/Terms-Of-Use-CornellGPT-96c16de16cc94ff5b574fb4632b069e9" className={styles.termsOfUse} target="_blank">CornellGPT is not perfect. Double-check key academic information.</a> 

                <form onSubmit={handleSubmit}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={3}
                    maxLength={100000} // input size adjustment***
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Retrieving...'
                        : placeholderText
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
                        <LoadingDots color="rgb(146, 40, 40)" />
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
        </footer>
        </div>
        </div>
    </>
  );
}










