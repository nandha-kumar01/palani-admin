// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyDisV34vOqBOcbQ_vaV4P6GBQE6G_A6dFU",
  authDomain: "palani-pathaiyathrai.firebaseapp.com",
  projectId: "palani-pathaiyathrai",
  storageBucket: "palani-pathaiyathrai.firebasestorage.app",
  messagingSenderId: "281050665050",
  appId: "1:281050665050:web:6b137c7026ecdf47600863",
  measurementId: "G-BGT2QWFTJN"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Handle the click event - open the app or navigate to specific page
  event.waitUntil(
    clients.openWindow('/')
  );
});
