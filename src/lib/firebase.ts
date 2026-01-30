import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';



// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJkpgg7K6yTyii-hBR2tCR0AX21bTQNgw",
  authDomain: "agrispace-ea219.firebaseapp.com",
  projectId: "agrispace-ea219",
  storageBucket: "agrispace-ea219.firebasestorage.app",
  messagingSenderId: "528915442362",
  appId: "1:528915442362:web:1c00c4257780e04aea3083",
  measurementId: "G-WWZSNCRDH0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
