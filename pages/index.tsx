import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/courseSelection.module.css';
import CourseBox from 'components/CourseBox';

function CourseCatalog() {
  const courses = [
    { key: 'INFO 2950', title: 'INFO 2950', professor: 'Professor Koenecke' },
    { key: 'INFO 2040', title: 'INFO 2040', professor: 'Professor David Easley' },
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
      <h1 className={styles.title}>CornellGPT Beta</h1>
      <p className={styles.subtitle}>What class would you like help with?</p>
      <input
        type="text"
        placeholder="Search for a course..."
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
