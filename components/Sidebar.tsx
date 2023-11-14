import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from '@/styles/Sidebar.module.css';

type ChatSession = {
    _id: string;
    sessionID: string;
    name: string;
    date: string;
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

    const [bottomSectionHeight, setBottomSectionHeight] = useState(0); // State for the height of the bottom section
    const bottomSectionRef = useRef(null); // Ref for the bottom section

  //   useEffect(() => {
  //     // ... (existing useEffect logic)
  //     // Additional logic to calculate bottom section height
  //     if (bottomSectionRef.current) {
  //         setBottomSectionHeight(bottomSectionRef.current.offsetHeight);
  //     }
  // }, [bottomSectionRef, isSidebarOpen]); 




    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Function to toggle sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };








    const getSessionName = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
    };

    const sessionsByDate = chatSessions.reduce((acc, session) => {
        const dateStr = new Date(session.date).toLocaleDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(session);
        return acc;
      }, {} as Record<string, ChatSession[]>);
    
      // Sort dates
      const sortedDates = Object.keys(sessionsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    

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

        fetchChatSessions();
        
    }, [currentSessionID, sessions, className, onSessionChange]);

    //initializes the UI with a session instantly

    const initNewChat = async () => {
      const newSessionID = uuidv4();
      const sessionName = getSessionName(); 
        try {
            const response = await fetch('/api/createNewChatSession', {
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
            const sessionDate = await response.json();
            localStorage.setItem('sapp', newSessionID);
            setCurrentSessionID(newSessionID);
            setChatSessions(prevSessions => [...prevSessions, { _id: newSessionID, sessionID: newSessionID, name: "Default Name", date: sessionDate.date}]);
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
        body: JSON.stringify({ userID, sessionID: currentSessionID, course: className }),
      });
      const newSession = await response.json();

      if (!newSession.exists) {
        const newSessionID = uuidv4();
        const sessionName = getSessionName(); // Get the session name based on current time
    
        try {
          const response = await fetch('/api/createNewChatSession', {
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
          const sessionDate = await response.json();
          localStorage.setItem('sapp', newSessionID);
          setCurrentSessionID(newSessionID);
          setChatSessions(prevSessions => [...prevSessions, { _id: newSessionID, sessionID: newSessionID, name: sessionName, date: sessionDate.date }]);
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

    const handleDeleteSession = async (sessionId: string | null) => {
        // Use window.confirm to display the confirmation dialog

        if (chatSessions.length <= 1) {
            alert("You cannot delete a chat session if you only have one");
            return;
        }

        const isConfirmed = window.confirm('Are you sure you want to delete this chat session?');
      
        // If the user clicks 'OK', proceed with the deletion
        if (isConfirmed && sessionId) {
          console.log(`Delete session with ID: ${sessionId}`);
          const response = await fetch('/api/deleteSession', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionID: sessionId, className }), // Make sure you pass the correct sessionID to delete
          });
          if (response.ok) {
            // If the delete operation was successful, update the state to remove the session
            setChatSessions(prevSessions => prevSessions.filter(session => session.sessionID !== sessionId));
            const latestSessionResponse = await fetch('/api/getLatestSess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    course: className, // Assuming 'className' holds the course title
                    userID: localStorage.getItem('lapp'), // Pass the current user's ID
                }),
            });
            if (latestSessionResponse.ok) {
                const latestSessionData = await latestSessionResponse.json();
                localStorage.setItem('sapp', latestSessionData.sessionID);
                setCurrentSessionID(latestSessionData.sessionID);
                if (onNewChat) {
                    onNewChat(latestSessionData);
                  }
            } else {
                console.error('Failed to fetch the latest session.');
            }
          } else {
            // If there was an error, you can handle it here
            console.error('Failed to delete the session.');
          }
        } else {
          // If the user clicks 'Cancel', do nothing
          console.log('Deletion cancelled.');
        }

        
        
      };
      
      

    return (
        <div>
        <div className={styles.side}>
        <button onClick={handleNewChat} className={styles.newChatButton}>
  CornellGPT
  <img src="/chat.png" alt="Chat" className={styles.chatIcon} />
</button>
            {sortedDates.map(date => (
                <div key={date}>
                    <h3 className={styles.dateHeading}>{date}</h3>
                    {sessionsByDate[date].map(session => (
                        <div key={session._id} className={styles.sessionContainer}>
                            <button
                                onClick={() => {
                                    localStorage.setItem('sapp', session.sessionID);
                                    setCurrentSessionID(session.sessionID);
                                    if (onSessionChange) {
                                        onSessionChange(session.sessionID);
                                    }
                                }}
                                className={`${styles.sessionButton} ${session.sessionID === currentSessionID ? styles.activeSessionButton : ''}`}
                            >
                                <span className={styles.sessionName}>{session.name}</span>
                                <span 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent the session button's click event
                                        handleDeleteSession(session.sessionID);
                                    }}
                                    className={styles.trashCan}>
                                    𝘅
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
            ))}
            {/* Add the new section here */}
            <div className={styles.bottomSection}>

<button className={`${styles.bottomButton} ${styles.referButton}`}>
  <img src="/refericon.png" alt="Refer" className={styles.referIcon} /> {/* Replace with the actual path to your refer icon */}
  REFER
  <span className={styles.newTag}>FREE</span>
</button>
                <button className={styles.bottomButton}>
                    <img src="/discord.png" alt="Discord" className={styles.discordIcon} /> {/* Make sure the path is correct */}
                    CornellGPT Discord
                </button>
                <button className={styles.bottomButton}>
                  <img src="/logout.png" alt="Log Out" className={styles.logoutIcon} />
                  <span className={styles.logoutText}>Log Out</span>
                </button>
            </div>
        </div>
    </div>
); 
                                  }

export default Sidebar;
