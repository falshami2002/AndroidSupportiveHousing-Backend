const admin = require("firebase-admin");
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountString) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing!");
}

const serviceAccount = JSON.parse(serviceAccountString);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;