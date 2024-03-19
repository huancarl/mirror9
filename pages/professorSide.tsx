import React, { useState, useEffect, useRef} from 'react';
import Link from 'next/link';
import styles from '@/styles/professorSide.module.css';
import {withSession, isAuthenticated} from 'utils/session';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const Chatbot = dynamic(() => import(`@/pages/chatbot`), { ssr: false });
const SetInstructions = dynamic(() => import('@/pages/professor-prompt'), { ssr: false });
const StudentAnalytics = dynamic(() => import('@/pages/studentData'), { ssr: false });

//Make sure that the page cannot be accessed without being a professor
export const getServerSideProps = withSession(async ({ req, res }) => {
    const user = await isAuthenticated(req);
    if (!user) {

        if(!user.isProfessor){
            return {
                redirect: {
                    destination: '/loginEmail', // Redirect to the sign-in page
                    permanent: false,
                },
            };
        }
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
  




function ProfessorHome() {

    const router = useRouter();
    const [className, setClassName] = useState<string>('');
    const userIDRef = useRef<string | null>(null);
    const [classSubject, setClassSubject] = useState<string>('');

    const [currentView, setCurrentView] = useState('default');

    async function fetchProfClass() {

        const sessionRes = await fetch('/api/userInfo');
        const sessionData = await sessionRes.json();

        if (sessionRes.ok) {
          userIDRef.current = sessionData.email;
        }
        else {
          // Handle the case where the session is not available
          console.error('Session not found:', sessionData.error);
          return;
        }

        //Gets from the database the data for the class of the prof like name of class and its subject
        const response = await fetch('/api/fetchClassOfProfessor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID: userIDRef.current
          }),
        });

        const professorClassData = await response.json();
        const professorClass= professorClassData.profClass;
        const professorSubject = professorClassData.profSubject;

        let nameOfClass = professorClass;
        nameOfClass = nameOfClass.replace(/_/g, ' '); 

        console.log(nameOfClass, 'nameofclass');

        setClassName(nameOfClass)
        setClassSubject(professorSubject);

        router.push({
            pathname: '/professorSide',
            query: { course: nameOfClass, subject: professorSubject },
          });

    }

    useEffect(() => {
        //Get the professor's class
        fetchProfClass();
    }, []);


    const changeView = (view) => {
        setCurrentView(view);
    };

    const Chatbot = dynamic(() => import('@/pages/chatbot'), { ssr: false });
    const SetInstructions = dynamic(() => import('@/pages/professor-prompt'), { ssr: false });





        return (
            <div className={styles.wrapper}>
                <aside className={styles.sidebar}>
                    <div className={styles.courseInfo}>
                        <h1 className={styles.courseTitle}>{className}</h1>
                        <p className={styles.professorName}>Professor Blake</p>
                    </div>
                    <nav className={styles.navigation}>
                        <div className={styles.controlSection}>
                            <p className={styles.sectionTitle}><span className={styles.sectionTitleText}>Control Your AI</span></p>
                            <a className={styles.optionLink}>Update Materials</a>
                            <div onClick={() => changeView('setInstructions')} className={styles.optionLink}>
                            Set Instructions
                        </div>
                            <a className={styles.optionLink}>Professor AI</a>
                        </div>
                        <div className={styles.studentViewSection}>
                            <p className={styles.sectionTitle}><span className={styles.sectionTitleText}>Student-View</span></p>
                            <div onClick={() => changeView('studentAnalytics')} className={styles.optionLink}>
                                Student Analytics
                            </div>
                            <div onClick={() => changeView('studentAI')} className={styles.optionLink}>
                                Student AI
                            </div>
                        </div>
                



                    </nav>
                </aside>
                <main className={styles.content}>
                    {currentView === 'studentAI' && <Chatbot />}
                    {currentView === 'setInstructions' && <SetInstructions />}
                    {currentView === 'studentAnalytics' && <StudentAnalytics />}
                </main>
            </div>
        );
        }
export default ProfessorHome;
