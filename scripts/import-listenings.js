/* eslint-disable */
const fs = require('fs');
const xlsx = require('xlsx');
const admin = require('firebase-admin');
const path = require('path');

// Parse CLI arguments manually
const args = process.argv.slice(2);
const params = {
  file: null,
  append: false,
  replace: false,
  setStartDate: null
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i+1]) {
    params.file = args[i+1];
    i++;
  } else if (args[i] === '--append') {
    params.append = true;
  } else if (args[i] === '--replace') {
    params.replace = true;
  } else if (args[i] === '--set-start-date' && args[i+1]) {
    params.setStartDate = args[i+1];
    i++;
  }
}

async function run() {
  console.log("Starting Daily Sadhana Import...");

  if (!params.file) {
    console.error("Error: --file argument is required.");
    console.log("Usage: node import-listenings.js --file <path> [--append] [--replace] [--set-start-date YYYY-MM-DD]");
    process.exit(1);
  }

  if (params.append && params.replace) {
    console.error("Error: Cannot use both --append and --replace.");
    process.exit(1);
  }

  // Load Firebase Service Account
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

  if (!serviceAccountPath) {
    console.error("Error: FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not set in .env.local");
    process.exit(1);
  }

  let serviceAccount;
  try {
    serviceAccount = require(path.resolve(__dirname, '..', serviceAccountPath));
  } catch (e) {
    console.error("Failed to load service account key from", serviceAccountPath, e.message);
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();

  // Handle setting start date
  if (params.setStartDate) {
    // Basic validation YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.setStartDate)) {
      console.error("Invalid start date format. Must be YYYY-MM-DD");
      process.exit(1);
    }
    console.log(`Setting config/startDate to ${params.setStartDate}`);
    await db.collection('config').doc('startDate').set({ startDate: params.setStartDate });
  }

  // Read Excel
  console.log(`Reading file: ${params.file}`);
  let workbook;
  try {
    workbook = xlsx.readFile(params.file);
  } catch(e) {
    console.error("Failed to read Excel file", e.message);
    process.exit(1);
  }

  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const validRows = data.map((row) => ({
    number: parseInt(row.Number, 10),
    title: String(row.Title || '').trim(),
    url: String(row.URL || '').trim()
  })).filter(row => !isNaN(row.number) && row.title && row.url);

  console.log(`Found ${validRows.length} valid rows.`);

  const listeningsRef = db.collection('listenings');

  if (params.replace) {
    console.log("Replacing existing listenings... Deleting old records.");
    const existing = await listeningsRef.get();
    const batchDelete = db.batch();
    existing.docs.forEach(doc => {
      batchDelete.delete(doc.ref);
    });
    await batchDelete.commit();
    console.log(`Deleted ${existing.size} old listenings.`);
  }

  let importedCount = 0;
  let skippedCount = 0;

  // Let's get existing max orderIndex to append correctly if in append mode
  let orderIndexOffset = 0;
  const existingDocsRef = await listeningsRef.orderBy('orderIndex', 'desc').limit(1).get();
  if (!existingDocsRef.empty && params.append) {
    orderIndexOffset = existingDocsRef.docs[0].data().orderIndex + 1;
  } else if (params.replace) {
    orderIndexOffset = 0;
  }

  console.log(`Starting import (offset starting at ${orderIndexOffset})...`);

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    const docId = String(row.number); // enforce uniqueness by using the number as the ID

    const docSnap = await listeningsRef.doc(docId).get();
    
    if (docSnap.exists && params.append) {
      // Skip because we are appending and doc already exists
      skippedCount++;
    } else {
      await listeningsRef.doc(docId).set({
        number: row.number,
        title: row.title,
        url: row.url,
        orderIndex: orderIndexOffset++
      });
      importedCount++;
    }
  }

  console.log(`Import complete! Imported: ${importedCount}, Skipped: ${skippedCount}`);
  process.exit(0);
}

run().catch(console.error);
