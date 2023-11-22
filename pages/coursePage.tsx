import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/courseSelection.module.css';
import CourseBox from 'components/CourseBox';
import { v4 as uuidv4 } from 'uuid';

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

  useEffect(() => {
    const fetchOrCreateRef = async() => {

      const sessionRes = await fetch('/api/userInfo');
        const sessionData = await sessionRes.json();
        if (sessionRes.ok) {
            // Set userID to the user's email from the session
            const userID = sessionData.email;
            let link = "https://cornellgpt.com/";
  
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


  const courses = [
    { key: 'INFO 2950', title: 'INFO 2950', professor: 'Professor Koenecke' },
    { key: 'INFO 2040', title: 'INFO 2040', professor: 'Professor Easley' },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState(courses);

  useEffect(() => {
    const results = courses.filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.professor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(results);
  }, [searchTerm]);

  return (
    <div className={styles.container}>
      <div className={styles.referralText}>FREE REFERRAL:<a> {referralLink} </a></div>
      <div className={styles.classInquiryContainer}>
        <button
    className={styles.classInquiryButton}
    onClick={() => window.open('https://forms.gle/Gz6Th57GLCa6y2jR6', '_blank')}
  >
    DON'T SEE YOUR CLASS?
  </button>
      </div>
      <h1 className={styles.title}>CornellGPT FA23</h1>
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
