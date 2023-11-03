import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from '@/styles/Sidebar.module.css';

type ChatSession = {
    _id: string;
    sessionID: string;
    name: string;
};

type SidebarProps = {
    className?: any;
    onSessionChange?: (sessionId: string) => void;
    sessions?: ChatSession[];
    onNewChat?: (newChatSession: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ className, onSessionChange, sessions, onNewChat }) => {
    const [chatSessions, setChatSessions] = useState<ChatSession[]>(sessions || []);
    const [currentSessionID, setCurrentSessionID] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sapp');
        }
        return null;
    });

    const getSessionName = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
    };

    useEffect(() => {
        async function fetchChatSessions() {
            try {
                const response = await fetch('/api/fetchAllSessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userID: localStorage.getItem('lapp'),
                        course: className,
                    }),
                });
                const data = await response.json();

                if (data.sessions === false) {
                    console.log('No sessions found, creating a new one...');
                    initNewChat();
                } else {
                    setChatSessions(data.sessions || []);
                    // Ensure that the current session is valid
                    if (!data.sessions.find(session => session.sessionID === currentSessionID)) {
                        const newCurrentSessionID = data.sessions[0]?.sessionID || null;
                        localStorage.setItem('sapp', newCurrentSessionID);
                        setCurrentSessionID(newCurrentSessionID);
                        if (onSessionChange && newCurrentSessionID) {
                            onSessionChange(newCurrentSessionID);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch chat sessions:', error);
            }
        }

        if (!sessions || currentSessionID === null) {
            fetchChatSessions();
        }
    }, [currentSessionID, sessions, className, onSessionChange]);

    const initNewChat = async () => {
      const newSessionID = uuidv4();
      const sessionName = getSessionName(); 
        try {
            await fetch('/api/createNewChatSession', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userID: localStorage.getItem('lapp'),
                    sessionID: newSessionID,
                    course: className,
                    name: sessionName,
                }),
            });
            localStorage.setItem('sapp', newSessionID);
            setCurrentSessionID(newSessionID);
            setChatSessions(prevSessions => [...prevSessions, { _id: newSessionID, sessionID: newSessionID, name: "Default Name" }]);
            if (onNewChat) {
                onNewChat(newSessionID);
            }
        } catch (error) {
            console.error('Failed to create new chat session:', error);
        }
    }

    const handleNewChat = async () => {

      const userID = localStorage.getItem('lapp');
      const response = await fetch('/api/checkForNewSessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID, sessionID: currentSessionID }),
      });
      const newSession = await response.json();

      if (!newSession.exists) {
        const newSessionID = uuidv4();
        const sessionName = getSessionName(); // Get the session name based on current time
    
        try {
          await fetch('/api/createNewChatSession', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userID: localStorage.getItem('lapp'),
              sessionID: newSessionID,
              course: className,
              name: sessionName, // Send the session name to the server
            }),
          });
          localStorage.setItem('sapp', newSessionID);
          setCurrentSessionID(newSessionID);
          setChatSessions(prevSessions => [...prevSessions, { _id: newSessionID, sessionID: newSessionID, name: sessionName }]);
          if (onNewChat) {
            onNewChat(newSessionID);
          }
        } catch (error) {
          console.error('Failed to create new chat session:', error);
        }
      }
      else{
        const idOfEmptySession = newSession.sessionID;
        localStorage.setItem('sapp', idOfEmptySession);
        setCurrentSessionID(idOfEmptySession);
        if (onNewChat) {
          onNewChat(idOfEmptySession);
        }
      }
        
    }

    return (
        <div className={styles.side}>
            <button onClick={handleNewChat} className={styles.newChatButton}>+  New Chat</button>
            {chatSessions.map(session => (
                <button
                    key={session._id}
                    onClick={() => {
                        localStorage.setItem('sapp', session.sessionID);
                        setCurrentSessionID(session.sessionID);
                        if (onSessionChange) {
                            onSessionChange(session.sessionID);
                        }
                    }}
                    className={`${styles.sessionButton} ${session.sessionID === currentSessionID ? styles.activeSessionButton : ''}`}
                >
                    {session.name}
                </button>
            ))}
        </div>
    );
}

export default Sidebar;
