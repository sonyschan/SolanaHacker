/**
 * Firebase Client SDK Configuration
 * 前端直接連接 Firestore 進行即時讀取
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Collection references
export const collections = {
  MEMES: 'memes',
  VOTES: 'votes',
  VOTE_STATS: 'voteStats',
  USERS: 'users',
  TICKETS: 'user_tickets',
  LOTTERY: 'lottery_draws'
};

/**
 * 即時監聽今日梗圖
 */
export const subscribeTodayMemes = (callback) => {
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
  const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();
  
  const q = query(
    collection(db, collections.MEMES),
    where('type', '==', 'daily'),
    where('status', '==', 'active'),
    where('generatedAt', '>=', startOfDay),
    where('generatedAt', '<=', endOfDay),
    orderBy('generatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const memes = [];
    snapshot.forEach(doc => {
      memes.push({ id: doc.id, ...doc.data() });
    });
    callback(memes);
  }, (error) => {
    console.error('Error subscribing to memes:', error);
    callback([], error);
  });
};

/**
 * 即時監聽投票統計
 */
export const subscribeVoteStats = (memeId, callback) => {
  const docRef = doc(db, collections.VOTE_STATS, memeId);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ common: 0, rare: 0, legendary: 0 });
    }
  }, (error) => {
    console.error('Error subscribing to vote stats:', error);
    callback({ common: 0, rare: 0, legendary: 0 }, error);
  });
};

/**
 * 即時監聽用戶資料
 */
export const subscribeUserData = (walletAddress, callback) => {
  if (!walletAddress) {
    callback(null);
    return () => {};
  }
  
  const docRef = doc(db, collections.USERS, walletAddress);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback({ 
        id: walletAddress, 
        consecutiveDays: 0, 
        totalTickets: 0,
        lastVoteDate: null 
      });
    }
  }, (error) => {
    console.error('Error subscribing to user data:', error);
    callback(null, error);
  });
};

/**
 * 一次性讀取今日梗圖 (不需要即時更新時使用)
 */
export const getTodayMemes = async () => {
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
  const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();
  
  const q = query(
    collection(db, collections.MEMES),
    where('type', '==', 'daily'),
    where('status', '==', 'active'),
    where('generatedAt', '>=', startOfDay),
    where('generatedAt', '<=', endOfDay),
    orderBy('generatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const memes = [];
  snapshot.forEach(doc => {
    memes.push({ id: doc.id, ...doc.data() });
  });
  
  return memes;
};

/**
 * 獲取 GCS 圖片 URL
 */
export const getMemeImageUrl = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};

export { db, storage };
