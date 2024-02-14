// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjXYdilXhoG6t8ZI1taaZsJNwpuA8Njp0",
  authDomain: "gptcornell.firebaseapp.com",
  databaseURL: "https://gptcornell-default-rtdb.firebaseio.com",
  projectId: "gptcornell",
  storageBucket: "gptcornell.appspot.com",
  messagingSenderId: "470419410736",
  appId: "1:470419410736:web:60773dbdc58d81e034c2f5",
  measurementId: "G-8KRK5JFE1Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export default app;

