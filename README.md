# Daily Sadhana: Bhakti Sastri Batch

A Next.js web application for delivering a daily listening track to students. Features local midnight delivery, Google Sign-in, local-only audio/file draft storage (no cloud byte uploads), streak tracking, and bookmarks.

## Project Architecture
- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Firebase Auth (Google), Firestore Database.
- **Local Storage**: IndexedDB (using `idb-keyval`) for securely storing audio/file blobs on the user's device without uploading to the cloud.

---

## 1. Prerequisites

1. **Node.js**: v18.17.0 or higher.
2. **Vercel Account**: For deploying the Next.js app.
3. **Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Add a new project.
   - Enable **Authentication** -> Add **Google Sign-In**.
   - Enable **Firestore Database** (start in production mode).
   - Go to Project Settings -> Service Accounts -> **Generate new private key**. Save this JSON file securely.

---

## 2. Environment Variables

Create a `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"

# Path to the downloaded service account JSON file for the CLI tools
FIREBASE_SERVICE_ACCOUNT_KEY_PATH="./service-account-key.json"
```

> **WARNING**: Never commit `.env.local` or the `service-account-key.json` file to GitHub.

---

## 3. Local Setup

Clone the repository or navigate to this folder, then run:

```bash
npm install
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 4. Firebase Setup & Security Rules

You must deploy the Firestore security rules to protect user data. 
The included `firestore.rules` file enforces that users can only read the global `listenings` and `config` collections, and can only write to their own `submissions` and `bookmarks`.

Deploy them using the Firebase CLI (or paste them directly into the Firebase Console -> Firestore -> Rules):

```bash
npm install -g firebase-tools
firebase login
firebase init firestore # (select your project)
firebase deploy --only firestore:rules
```

---

## 5. Admin Tasks & Importing Listenings

The application relies on an administrative global list of listenings. We provide a Node CLI script to seed your Firestore database from an Excel template.

### A) Generate the Template
Run the following command to generate `listenings-template.xlsx`:
```bash
node scripts/create-template.js
```

### B) Populate the Excel File
Open `listenings-template.xlsx` and add your rows. The columns must be exactly: `Number`, `Title`, `URL`.

### C) Import to Firestore
Use the included CLI script (requires `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` in your `.env.local`).

**Replace ALL listenings and set Start Date:**
```bash
node scripts/import-listenings.js --file listenings-template.xlsx --replace --set-start-date 2026-03-10
```

**Append new listenings only (preserves existing data):**
```bash
node scripts/import-listenings.js --file listenings-template.xlsx --append
```

---

## 6. How Publishing Works

The app synchronizes a global sequence using the `config/startDate` document (e.g. `2026-03-10`). 
However, **the actual published video is calculated based on the user's LOCAL timezone.**

- The app takes the user's local `new Date()`.
- It calculates the `daysElapsed` between their local midnight and the `startDate` local midnight.
- The index wraps around continuously: `index = daysElapsed % totalListenings`
- If an Australian user crosses midnight, they will see track #5 immediately, while a US user will continue to see track #4 until their own local midnight.

---

## 7. Security & Privacy

### No Files Uploaded to Cloud
All file attachments, photos, and voice notes recorded by the user are stored safely in their browser's **IndexedDB**. 
Upon clicking "Submit", the system deletes the local device data and **only writes a metadata boolean flag** (`{ submitted: true }`) to Firestore. Real file bytes are never sent over the network.

### Deleting Data
Users' device-specific drafts disappear permanently upon submission or by clicking the trash icon.

---

## 8. Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. In the Vercel project settings, add the Environment Variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. Deploy.

---

## 9. Testing & Acceptance

- **Date Testing:** Change your computer's system clock/date and refresh the page to see the listening index jump forward/backward.
- **Audio Testing:** Ensure microphone permissions are granted. Record, pause, and preview. Note how the network tab shows NO payloads containing audio blobs during submission.
- **Database Rules:** Attempt to write to `listenings` as a normal authenticated user from the client console to verify denial.
