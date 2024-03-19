import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
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
    
    <BarChart width={730} height={250} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="Course Materials" fill="#8884d8" />
    </BarChart>




  </div>
  
  
  
  
  
  );
}


export default StudentAnalytics;
