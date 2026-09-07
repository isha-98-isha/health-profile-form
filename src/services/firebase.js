import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const firebaseConfigReady = Object.values(firebaseConfig).every(Boolean);

const firebaseApp = firebaseConfigReady ? initializeApp(firebaseConfig) : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

if (process.env.NODE_ENV === 'development') {
	console.info('[Firebase] Environment variables detected:', {
		apiKey: Boolean(firebaseConfig.apiKey),
		authDomain: Boolean(firebaseConfig.authDomain),
		projectId: Boolean(firebaseConfig.projectId),
		storageBucket: Boolean(firebaseConfig.storageBucket),
		messagingSenderId: Boolean(firebaseConfig.messagingSenderId),
		appId: Boolean(firebaseConfig.appId),
	});
	console.info('[Firebase] Configuration ready:', firebaseConfigReady);
	console.info('[Firebase] Auth initialized:', Boolean(auth));
}