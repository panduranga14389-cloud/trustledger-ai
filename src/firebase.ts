
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDR7ZOdYJdTfyKzW9gH8AfTL9E3QuKStX0',
  authDomain: 'trustledger-ai.firebaseapp.com',
  projectId: 'trustledger-ai',
  storageBucket: 'trustledger-ai.firebasestorage.app',
  messagingSenderId: '491526263630',
  appId: '1:491526263630:web:9575fd36c7920f8f77c41f',
  measurementId: 'G-9SQMQ06QJP',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
