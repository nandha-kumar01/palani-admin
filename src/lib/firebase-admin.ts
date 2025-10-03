import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;

export const initializeFirebaseAdmin = (): admin.app.App => {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0] as admin.app.App;
    return adminApp;
  }

  // Validate required Firebase credentials
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing required Firebase service account credentials. Please check your environment variables.');
  }

  const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  } as admin.ServiceAccount;

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
    });

    return adminApp;
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
};

// Get Firebase Admin instance (initializes if not already done)
export const getFirebaseAdmin = (): admin.app.App => {
  return initializeFirebaseAdmin();
};

// Get Firebase Admin Auth
export const getFirebaseAdminAuth = () => {
  const app = getFirebaseAdmin();
  return admin.auth(app);
};

// Get Firebase Admin Database
export const getFirebaseAdminDatabase = () => {
  const app = getFirebaseAdmin();
  return admin.database(app);
};

// Get Firebase Admin Messaging
export const getFirebaseAdminMessaging = () => {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
};

export default admin;