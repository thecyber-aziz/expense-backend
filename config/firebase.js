import admin from 'firebase-admin';

console.log('🔄 firebase.js is loading...');
console.log('📋 process.env.FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? `SET (${(process.env.FIREBASE_SERVICE_ACCOUNT || '').substring(0, 50)}...)` : 'NOT SET');

// Initialize Firebase Admin SDK
let serviceAccount = {};

try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountJson) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT not found in .env file');
    console.warn('❌ Firebase Admin SDK will not be initialized');
    console.warn('Google authentication will not work');
  } else {
    console.log('📦 Parsing Firebase service account JSON...');
    serviceAccount = JSON.parse(serviceAccountJson);
    console.log('✅ Firebase service account loaded');
    console.log('🔧 Initializing Firebase Admin SDK...');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('🔑 Firebase project:', serviceAccount.project_id);
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  if (error.code === 'app/invalid-credential') {
    console.error('The credential is invalid. Make sure FIREBASE_SERVICE_ACCOUNT is valid JSON.');
  }
  console.error('Make sure FIREBASE_SERVICE_ACCOUNT in .env is valid JSON');
  console.error('Current value:', process.env.FIREBASE_SERVICE_ACCOUNT ? `Set (${(process.env.FIREBASE_SERVICE_ACCOUNT || '').substring(0, 100)}...)` : 'Not set');
}

export default admin;
