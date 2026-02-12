// Firebase Admin SDK configuration
const admin = require('firebase-admin');

let db = null;

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      db = admin.firestore();
      return db;
    }

    // Initialize Firebase Admin with service account
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });

    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      timestampsInSnapshots: true,
    });

    console.log('✅ Firebase Admin initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

/**
 * Get Firestore database instance
 */
const getFirestore = () => {
  if (!db) {
    db = initializeFirebase();
  }
  return db;
};

/**
 * Get Firebase Storage bucket
 */
const getStorageBucket = () => {
  if (!admin.apps.length) {
    initializeFirebase();
  }
  return admin.storage().bucket();
};

/**
 * Firestore collection helpers
 */
const collections = {
  MEMES: 'memes',
  VOTES: 'votes',
  USERS: 'users',
  LOTTERY_DRAWS: 'lottery_draws',
  USER_TICKETS: 'user_tickets',
  DAILY_STATS: 'daily_stats',
  // New collections for automation
  VOTING_PERIODS: 'voting_periods',
  NFTS: 'nfts',
  SCHEDULER_LOGS: 'scheduler_logs',
  VOTING_PROGRESS: 'voting_progress',
  SCHEDULER_STATUS: 'scheduler_status'
};

/**
 * Database utility functions
 */
const dbUtils = {
  /**
   * Get document by ID
   */
  async getDocument(collection, docId) {
    const doc = await getFirestore().collection(collection).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  /**
   * Create or update document
   */
  async setDocument(collection, docId, data) {
    const docRef = getFirestore().collection(collection).doc(docId);
    await docRef.set(data, { merge: true });
    return docId;
  },

  /**
   * Update specific fields in document
   */
  async updateDocument(collection, docId, data) {
    const docRef = getFirestore().collection(collection).doc(docId);
    await docRef.update(data);
    return docId;
  },

  /**
   * Add document with auto-generated ID
   */
  async addDocument(collection, data) {
    const docRef = await getFirestore().collection(collection).add(data);
    return docRef.id;
  },

  /**
   * Delete document
   */
  async deleteDocument(collection, docId) {
    await getFirestore().collection(collection).doc(docId).delete();
    return true;
  },

  /**
   * Query documents
   */
  async queryDocuments(collection, filters = []) {
    let query = getFirestore().collection(collection);
    
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Get collection with pagination
   */
  async getPaginatedCollection(collection, orderBy, limit = 20, startAfter = null) {
    let query = getFirestore()
      .collection(collection)
      .orderBy(orderBy, 'desc')
      .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    return {
      docs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  },

  /**
   * Run transaction
   */
  async runTransaction(updateFunction) {
    return getFirestore().runTransaction(updateFunction);
  },

  /**
   * Batch write operations
   */
  getBatch() {
    return getFirestore().batch();
  },

  /**
   * Get subcollection
   */
  async getSubcollection(parentCollection, parentDocId, subcollection) {
    const snapshot = await getFirestore()
      .collection(parentCollection)
      .doc(parentDocId)
      .collection(subcollection)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Query with orderBy and limit
   */
  async queryWithOrderAndLimit(collection, orderField, direction = 'desc', limit = 10, filters = []) {
    let query = getFirestore().collection(collection);
    
    // Apply filters first
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });

    // Apply ordering and limit
    query = query.orderBy(orderField, direction).limit(limit);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getStorageBucket,
  collections,
  dbUtils,
  admin
};