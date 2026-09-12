// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyADDIYDtnFB5VvJSxicCCVYrnbLVHisfWw",
  authDomain: "hiltoncargo-e57cc.firebaseapp.com",
  projectId: "hiltoncargo-e57cc",
  storageBucket: "hiltoncargo-e57cc.firebasestorage.app",
  messagingSenderId: "690051376622",
  appId: "1:690051376622:web:0c4ca8fe3b63a651e05aff",
  measurementId: "G-K1JY9PTSV4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);

export default app;