import React, { useState, useEffect, useRef } from 'react';
import {useRouter} from 'next/router';

function StudentAnalytics(){

  //Displays the analytics of students for the professor side view using MongoDB data and Recharts

  const [courseTitle, setCourseTitle] = useState<string>('');
  const router = useRouter();
  const [courseSubject, setCourseSubject] = useState<string>('');
  const [isLoading, setIsLoading]= useState(true);

  useEffect(() => {
    if (router.query.course && typeof(router.query.course) == 'string') {
        setCourseTitle(router.query.course);
        if(router.query.subject && typeof(router.query.subject) == 'string'){
          setCourseSubject(router.query.subject);
        }
        else{
          setCourseSubject('');
        }
        setIsLoading(false); // set loading to false when course is set
    }
  }, [router.query]);

  const data = [1000, 10, 1];



  return (
  

  <div>
    
    Under Construction




  </div>
  
  
  
  
  
  );
}


export default StudentAnalytics;
