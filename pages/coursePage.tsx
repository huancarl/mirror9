import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/courseSelection.module.css';
import CourseBox from 'components/CourseBox';
import { v4 as uuidv4 } from 'uuid';
import {withSession, isAuthenticated} from 'utils/session';

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

function CourseCatalog() {

  const [referralLink, setReferralLink] = useState('');

  function getOrGenerateUUID(key: string): string {
    let value = localStorage.getItem(key) || '';
    if (!value) {
        value = uuidv4();
        localStorage.setItem(key, value);
    }
    return value;
  }

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleReferralClick = () => {
    setIsPopupVisible(true);

  };


  useEffect(() => {
    const fetchOrCreateRef = async() => {

      const sessionRes = await fetch('/api/userInfo');
        const sessionData = await sessionRes.json();
        if (sessionRes.ok) {
            // Set userID to the user's email from the session
            const userID = sessionData.email;
            let link = "https://gptcornell.com/sign-up?referralCode=";
  
            let response = await fetch('/api/fetchOrCreateReferral', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  userID,
              }),
            });
            const data = await response.json();
            if(data){
              link = link + data.code;
              setReferralLink(link);
            }
        } else {
            // Handle the case where the session is not available
            console.error('Session not found:', sessionData.error);
            return;
        }
    }
    fetchOrCreateRef();
  }, []);

  //Don't trailing spaces to the key and title
  const courses = [
    { key: 'Course Finder SP24', title: 'Course Finder SP24', professor: '' },
    { key: 'INFO 2950', title: 'INFO 2950', professor: 'Data Science Professor Koenecke' },
    // // { key: 'INFO 2040', title: 'INFO 2040', professor: 'Professor Easley' },
    // { key: 'BIOEE 1540', title: 'BIOEE 1540', professor: 'Professor Monger' },
    // { key: 'AEM 2241', title: 'AEM 2241', professor: 'Professor Yang & Janosi' },
    { key: 'PUBPOL 2350', title: 'PUBPOL 2350', professor: 'US Health Care Professor Nicholson' },
    { key: 'ENTOM 2030', title: 'ENTOM 2030', professor: 'Honey Bees Professor Peck & Caillaud' },
    { key: 'CS 4780', title: 'CS 4780', professor: ' Professor Weinberger' },
    { key: 'ENGL 2800', title: 'ENGL 2800', professor: 'Creative Writing Elisávet Makridi' },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState(courses);



  const [referralCount, setReferralCount] = useState(1); // ****** Modify the use state depending on how many referral links are used and verified *****

  // const ProgressBar = ({ count }) => {
  //   const maxReferrals = 10; // Maximum number of referrals
  //   const progress = (count / maxReferrals) * 100; // Calculate progress percentage
    
  //   const indicators = Array.from({ length: maxReferrals }, (_, i) => i + 1);
  
  //   return (
  //     <div className={styles.referralTrackerWrapper}>
  //       <h2 className={styles.referralHeader}>Referral Tracker</h2>
  //       <div className={styles.progressBarWrapper}>
  //         <div className={styles.progressBarContainer}>
  //           <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
  //         </div>
  //         <div className={styles.progressNumbers}>
  //           {indicators.map((number) => (
  //             <div 
  //               key={number} 
  //               className={`${styles.progressNumber} ${number <= count ? styles.activeNumber : ''}`}
  //             >
  //               {number}
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };
  
  
  
  
  
  
  
  


  useEffect(() => {
    const results = courses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.professor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(results);
  }, [searchTerm]);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // Checkmark will disappear after 1.5 seconds
    });
  };


  const Popup = () => (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <div className={styles.popupHeader}>
          <h2>Get up to 200 free messages for referrals 🧸</h2>
          <button onClick={() => setIsPopupVisible(false)}>🅇</button>
        </div>
        <div className={styles.popupContent}>
        <p>Earn 20 messages for every Cornellian who signs up with your link —
           and they will get an extra 20 messages too! You 
           will get your bonus messages the minute they sign up.
        </p>

          <div className={styles.referralRewards}>
            <p>1 referral = 20 messages</p>
            <p>2 referrals = 40 messages</p>
            <p>10 referrals = 200 messages🔥</p>
          </div>
          <div className={styles.referralLinkBox}>
            <input type="text" value={referralLink} readOnly />
            <button onClick={handleCopy}>
              {copied ? "✓" : "Copy"}
            </button>
          </div>
          <div className={styles.referralLinkBox}>
            <input type="text" value={"xyz@cornell.edu"} />
            <button onClick={handleCopy}>
              {copied ? "✈️" : "Send"}
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
  

  return (
    <div className={styles.container}>
          {/* <ProgressBar count={referralCount} /> */}
          {isPopupVisible && <Popup />}
{/* <button className={styles.referralText} onClick={handleReferralClick}>
 GET FREE MESSAGES! 🎁
</button> */}
      <div className={styles.classInquiryContainer}>
        <button
    className={styles.classInquiryButton}
    onClick={() => window.open('https://forms.gle/Gz6Th57GLCa6y2jR6', '_blank')}
  >
    DONT SEE YOUR CLASS?
  </button>
      </div>
      <h1 className={styles.title}>CornellGPT SP24</h1>
      <input
        type="text"
        placeholder="What class would you like help with?..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      <div className={styles.courseGrid}>
        {filteredCourses.map(course => (
          <CourseBox key={course.key} title={course.title} professor={course.professor} />
        ))}
      </div>
    </div>
  );
      }

export default CourseCatalog;''
