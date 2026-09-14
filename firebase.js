// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlLjpPmv-pMEG5-daEKDw4D73eNkNlAIY",
  authDomain: "hiltons-cargos.firebaseapp.com",
  projectId: "hiltons-cargos",
  storageBucket: "hiltons-cargos.firebasestorage.app",
  messagingSenderId: "256453824216",
  appId: "1:256453824216:web:4af2e20b4b01ed355a11ad",
  measurementId: "G-8PTDYNW141"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);

export default app;
