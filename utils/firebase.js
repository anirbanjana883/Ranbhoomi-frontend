// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "loginranbhoomi.firebaseapp.com",
  projectId: "loginranbhoomi",
  storageBucket: "loginranbhoomi.firebasestorage.app",
  messagingSenderId: "1065395860705",
  appId: "1:1065395860705:web:7cb5b7601158867c9f33a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider()

export {auth,provider}