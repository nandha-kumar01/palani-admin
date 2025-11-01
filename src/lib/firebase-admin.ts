import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;
let initializationAttempted = false;

export const initializeFirebaseAdmin = (): admin.app.App | null => {
  // Return existing app if already initialized
  if (adminApp) {
    return adminApp;
  }

  // Don't attempt initialization multiple times if it failed
  if (initializationAttempted) {
    return null;
  }

  // Check if already initialized by another instance
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0] as admin.app.App;
    return adminApp;
  }

  initializationAttempted = true;

  // Validate required Firebase credentials
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    const serviceAccount = {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    } as admin.ServiceAccount;

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${projectId}-default-rtdb.firebaseio.com/`,
    });

    return adminApp;
  } catch (error: any) {
    return null;
  }
};

// Get Firebase Admin instance (initializes if not already done)
export const getFirebaseAdmin = (): admin.app.App | null => {
  return initializeFirebaseAdmin();
};

// Get Firebase Admin Auth (returns null if not initialized)
export const getFirebaseAdminAuth = () => {
  const app = getFirebaseAdmin();
  return app ? admin.auth(app) : null;
};

// Get Firebase Admin Database (returns null if not initialized)
export const getFirebaseAdminDatabase = () => {
  const app = getFirebaseAdmin();
  return app ? admin.database(app) : null;
};

// Get Firebase Admin Messaging (returns null if not initialized)
export const getFirebaseAdminMessaging = () => {
  const app = getFirebaseAdmin();
  return app ? admin.messaging(app) : null;
};

// Check if Firebase Admin is available
export const isFirebaseAdminAvailable = (): boolean => {
  return getFirebaseAdmin() !== null;
};

export default admin;