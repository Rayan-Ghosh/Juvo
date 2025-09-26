
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

let adminApp: admin.app.App | null = null;

function initializeAdminApp(): admin.app.App | null {
    if (admin.apps.length > 0) {
        // An app is already initialized, return it.
        return admin.apps[0];
    }
    
    try {
         // In a production environment (like App Hosting), GOOGLE_APPLICATION_CREDENTIALS
         // will be set automatically, and this will succeed.
        return admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: firebaseConfig.projectId,
        });
    } catch(e) {
        // This will often fail in local development if the GOOGLE_APPLICATION_CREDENTIALS
        // environment variable is not set. This is a non-fatal error for local dev
        // unless a feature requiring the Admin SDK (like creating a user) is used.
        console.warn(
            'Could not initialize Firebase Admin SDK. ' +
            'This is expected in local development if GOOGLE_APPLICATION_CREDENTIALS are not set. ' +
            'Admin features will not work.'
        );
        // Return null to indicate failure.
        return null;
    }
}

export function getAdminApp() {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    
    // If initialization failed (e.g., in local dev without credentials),
    // adminApp will be null. The calling function must handle this case.
    if (!adminApp) {
        // This provides a more specific error than "Cannot read 'INTERNAL' of undefined".
        throw new Error('Firebase Admin SDK is not available. Ensure GOOGLE_APPLICATION_CREDENTIALS are set for this environment.');
    }

    return {
        auth: adminApp.auth(),
        firestore: adminApp.firestore(),
    };
}
