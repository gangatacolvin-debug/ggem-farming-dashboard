import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC33we_uAFOAd3DlcNQhWt0IFdzs-r9O10",
  authDomain: "deletedlater.firebaseapp.com",
  projectId: "deletedlater",
  storageBucket: "deletedlater.firebasestorage.app",
  messagingSenderId: "494174106366",
  appId: "1:494174106366:web:4793ba206a2cb839e12baf",
  measurementId: "G-84QC053HPS"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;