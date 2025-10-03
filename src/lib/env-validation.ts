/**
 * Environment Variables Validation Utility
 * This ensures all required environment variables are available at build time
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

const optionalEnvVars = [
  'NEXTAUTH_URL',
  'GOOGLE_MAPS_API_KEY',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const;

export function validateEnvironmentVariables() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  });

  // Special check for Firebase - all or none
  const firebaseVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const firebaseVarsPresent = firebaseVars.filter(envVar => process.env[envVar]);
  
  if (firebaseVarsPresent.length > 0 && firebaseVarsPresent.length < firebaseVars.length) {
    const missingFirebase = firebaseVars.filter(envVar => !process.env[envVar]);
    console.warn('⚠️ Partial Firebase configuration detected. Missing:', missingFirebase);
    console.warn('Firebase features will be disabled. Set all Firebase variables to enable notifications.');
  } else if (firebaseVarsPresent.length === firebaseVars.length) {
    console.log('✅ Firebase configuration complete');
  } else {
    console.warn('⚠️ Firebase not configured. Notification features will be disabled.');
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please set these in your Vercel dashboard or .env.local file');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Missing optional environment variables:', warnings);
    console.warn('Some features may not work properly');
  }

  console.log('✅ All required environment variables are present');
}

// Environment validation is now done during actual database connections
// instead of during module import to prevent build-time issues

export default validateEnvironmentVariables;