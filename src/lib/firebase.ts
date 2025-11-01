import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, off, Database, DataSnapshot } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDisV34vOqBOcbQ_vaV4P6GBQE6G_A6dFU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "palani-pathaiyathrai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "palani-pathaiyathrai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "palani-pathaiyathrai.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "281050665050",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:281050665050:web:6b137c7026ecdf47600863",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BGT2QWFTJN",
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "palani-pathaiyathrai"}-default-rtdb.firebaseio.com/`,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// Initialize Analytics only on client side
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Messaging only on client side
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Location tracking functions
export interface LocationData {
  userId: string;
  groupId?: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface UserLocationUpdate extends LocationData {
  userName: string;
  userEmail: string;
  isTracking: boolean;
  pathayathiraiStatus: string;
  totalDistance: number;
  distanceFromAdmin?: number;
}

// Update user location in Firebase
export const updateUserLocation = async (locationData: UserLocationUpdate): Promise<void> => {
  try {
    const userLocationRef = ref(database, `locations/users/${locationData.userId}`);
    await set(userLocationRef, {
      ...locationData,
      timestamp: Date.now(),
    });

    // Also update in group locations if user belongs to a group
    if (locationData.groupId) {
      const groupLocationRef = ref(database, `locations/groups/${locationData.groupId}/${locationData.userId}`);
      await set(groupLocationRef, {
        ...locationData,
        timestamp: Date.now(),
      });
    }
  } catch (error) {

    throw error;
  }
};

// Subscribe to user location updates
export const subscribeToUserLocation = (
  userId: string,
  callback: (locationData: UserLocationUpdate | null) => void
): (() => void) => {
  const userLocationRef = ref(database, `locations/users/${userId}`);
  
  const unsubscribe = onValue(
    userLocationRef, 
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    },
    (error) => {

      callback(null);
    }
  );

  return () => off(userLocationRef);
};

// Subscribe to group location updates (only members of the specific group)
export const subscribeToGroupLocations = (
  groupId: string,
  callback: (locations: Record<string, UserLocationUpdate>) => void
): (() => void) => {
  const groupLocationRef = ref(database, `locations/groups/${groupId}`);
  
  const unsubscribe = onValue(
    groupLocationRef, 
    (snapshot: DataSnapshot) => {
      const data = snapshot.val() || {};

      callback(data);
    },
    (error) => {

      callback({});
    }
  );

  return () => off(groupLocationRef);
};

// Subscribe to all active locations
export const subscribeToAllLocations = (
  callback: (locations: Record<string, UserLocationUpdate>) => void
): (() => void) => {
  const allLocationsRef = ref(database, 'locations/users');
  
  const unsubscribe = onValue(
    allLocationsRef, 
    (snapshot: DataSnapshot) => {
      const data = snapshot.val() || {};
      callback(data);
    },
    (error) => {

      callback({});
    }
  );

  return () => off(allLocationsRef);
};

// Remove user location when they stop tracking
export const removeUserLocation = async (userId: string, groupId?: string): Promise<void> => {
  try {
    const userLocationRef = ref(database, `locations/users/${userId}`);
    await set(userLocationRef, null);

    if (groupId) {
      const groupLocationRef = ref(database, `locations/groups/${groupId}/${userId}`);
      await set(groupLocationRef, null);
    }
  } catch (error) {

    throw error;
  }
};

// Get distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Distance in meters
  return distance;
};

export default app;

// FCM (Firebase Cloud Messaging) functions
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging || typeof window === 'undefined') return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Check if VAPID key is available
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {

        // Try to get token without VAPID key (may work in some browsers)
        try {
          const token = await getToken(messaging);
          return token;
        } catch (error) {

          return null;
        }
      }
      
      const token = await getToken(messaging, {
        vapidKey: vapidKey
      });
      return token;
    }
    return null;
  } catch (error) {

    return null;
  }
};

export const onMessageListener = () => {
  if (!messaging) return Promise.resolve();
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

// Store FCM token for user
export const storeFCMToken = async (userId: string, token: string): Promise<void> => {
  if (!database) return;
  
  try {
    const userTokenRef = ref(database, `fcmTokens/${userId}`);
    await set(userTokenRef, {
      token,
      timestamp: Date.now(),
      platform: 'web'
    });
  } catch (error) {

  }
};

// Send notification via FCM
export const sendNotificationToUser = async (
  userId: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<void> => {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        data,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send notification');
    }
  } catch (error) {

  }
};
