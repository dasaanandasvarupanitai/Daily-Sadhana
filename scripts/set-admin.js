/* eslint-disable */
const admin = require('firebase-admin');
const path = require('path');

const emailToMakeAdmin = "dasa.anandasvarupanitai@gmail.com";

async function run() {
  console.log(`\nAssigning Admin privileges to: ${emailToMakeAdmin}\n`);

  require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Error: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must be set in .env.local");
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  }

  try {
    // 1. Fetch user by email
    const userRecord = await admin.auth().getUserByEmail(emailToMakeAdmin);
    
    // 2. Set Custom Claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    // 3. For visibility, we optionally save the admin status to a Firestore 'admins' collection
    const db = admin.firestore();
    await db.collection('admins').doc(userRecord.uid).set({
      email: userRecord.email,
      grantedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`\nSUCCESS: Custom claim 'admin: true' has been set for ${emailToMakeAdmin}.`);
    console.log(`This user can now bypass UI viewing restrictions or write to the database directly from the frontend if an Admin UI is built in the future.`);
    console.log(`\nNote: The user may need to log out and log back in for the new claims to take effect on the client frontend.\n`);
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`ERROR: User not found. The user ${emailToMakeAdmin} must sign into the app with Google FIRST before you can make them an admin.`);
    } else {
      console.error("ERROR assigning admin:", error);
    }
    process.exit(1);
  }
}

run().catch(console.dir);
