import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '@/styles/professorMaterials.module.css';
import {withSession, isAuthenticated} from 'utils/session';
import { useRouter } from 'next/router';
import { read } from 'fs';

//Make sure that the page cannot be accessed without being a professor
// export const getServerSideProps = withSession(async ({ req, res }) => {
//     const user = await isAuthenticated(req);
//     if (!user) {

//         if(!user.isProfessor){
//             return {
//                 redirect: {
//                     destination: '/loginEmail', // Redirect to the sign-in page
//                     permanent: false,
//                 },
//             };
//         }
//         return {
//             redirect: {
//                 destination: '/loginEmail', // Redirect to the sign-in page
//                 permanent: false,
//             },
//         };
//     }
//     // User is authenticated
//     return { props: { user } };
//   });



function ProfessorModifyMaterials() {
    const [links, setLinks] = useState<any []>([]);
    const router = useRouter();
    const [className, setClassName] = useState('');

    const [homeworkLinks, setHomeworkLinks] = useState<JSX.Element[]>([]);
    const [lectureLinks, setLectureLinks] = useState<JSX.Element[]>([]);
    const [readingLinks, setReadingLinks] = useState<JSX.Element[]>([]);


    useEffect(() => {
        //Get the course from the url
        if (router.query.course) {
          const courseTitle = Array.isArray(router.query.course) ? router.query.course[0] : router.query.course;
          setClassName(courseTitle.replace(/ /g, '_'));
         
        }
    }, [router.query]);
  
    useEffect(() => {
        // Fetch materials using the courseTitle
        fetchCourseMaterials(className);
    });

    const handleButtonClick = (event) => {
        // You can differentiate buttons by passing an identifier to this function
        // For example, you can pass 'homework', 'lectures', etc.
        console.log('Button clicked:', event.currentTarget.name);
    };


    async function fetchCourseMaterials(className:string) {
      try {
        //Get mapping of class to materials
        const classResponse = await fetch('/api/classMapping');
        const classMapping = await classResponse.json();
  
        //Get mapping of materials to pdf names
        const pdfResponse = await fetch('/api/pdfMapping');
        const pdfMapping = await pdfResponse.json();
  
        // Assuming `courseTitle` is available somehow, replace spaces with underscores
        const title = className;

        const output = classMapping[title];
  
        const fetchedLinks: React.JSX.Element [] = [];
  
        for (let i = 0; i < output.length; i++) {
          let pdfName = pdfMapping[output[i]][0];
          pdfName += '.pdf';
  
          if (pdfName && pdfName !== `${title}_All_Materials.pdf`) {
            // Push a JSX element to the array
            fetchedLinks.push(
            <>
              <a key={pdfName} href={`/pdf/${pdfName}`} target="_blank" rel="noopener noreferrer"
                style={{
                  color: '#b12424',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 625,
                }}>
                {pdfName.replace(/_/g, ' ')} 
              </a>
              <br/>
            </>
            );
          }
        }
  
        // Update the state with the new links
        setLectureLinks(fetchedLinks);
        console.log(fetchedLinks);
  
      } catch (error) {
        console.error('Failed to fetch course materials:', error);
      }
    }
  
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Class Materials Access</h1>
            <details className={styles.dropdown}>
                <summary className={styles.dropdownTitle}>Class Logistics</summary>
   
                <div className={styles.dropdownContent}>
                    {lectureLinks}
                </div>
            </details>
            <details className={styles.dropdown}>
                <summary className={styles.dropdownTitle}>Notes</summary>
   
                <div className={styles.dropdownContent}>
                    {lectureLinks}
                </div>
            </details>
            <details className={styles.dropdown}>
                <summary className={styles.dropdownTitle}>Lectures</summary>
   
                <div className={styles.dropdownContent}>
                    {lectureLinks}
                </div>
            </details>
            <details className={styles.dropdown}>
                <summary className={styles.dropdownTitle}>Homework</summary>
                <div className={styles.dropdownContent}>
                    {homeworkLinks}
                </div>
            </details>
            <details className={styles.dropdown}>
                <summary className={styles.dropdownTitle}>Readings</summary>
                <div className={styles.dropdownContent}>
                    {readingLinks}
                </div>
            </details>
            <details className={styles.dropdown}>
                <summary className={styles.dropdownTitle}>Videos</summary>
                <div className={styles.dropdownContent}>

                </div>
            </details>
        </div>
    );
  }
  
  export default ProfessorModifyMaterials;