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

      const userID = getOrGenerateUUID('lapp');
  
      let link = "https://localhost.com/?ref={";
  
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
  
      link = link + data.code + '}';
      setReferralLink(link);
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
      <div className={styles.referralText}>Refer a friend! <a> {referralLink} </a></div>
      <h1 className={styles.title}> CornellGPT </h1>
      <p className={styles.subtitle}>What class would you like help with?</p>
      <input
        type="text"
        placeholder="Search for a course :)"
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

export default CourseCatalog;
