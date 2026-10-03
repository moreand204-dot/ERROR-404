ERROR 404 NOT FOUND — Firebase + Google Drive

- Firebase project: ourstory-f33db
- Google login: Firebase Authentication
- Admin: moreand458@gmail.com
- Firestore: app metadata, users, stats
- APK files: Google Drive
- Admin upload: admin.html → Google OAuth → Google Drive → Firestore
- Firebase Storage: NOT USED

Google Cloud setup required:
1) Enable Google Drive API in the ERROR 404 STORE Google Cloud project.
2) Google Auth Platform → Audience: External; add moreand458@gmail.com as a test user while the app is in Testing.
3) Google Auth Platform → Data Access: add https://www.googleapis.com/auth/drive.file.
4) Google Auth Platform → Clients: Web application with JavaScript origin https://error-404-tawny.vercel.app
5) No OAuth client secret is used in the frontend.

Firebase setup required:
1) Authentication → Sign-in method → Google → Enable.
2) Firestore Database → Create database.
3) Firestore → Rules → publish firestore.rules.
4) Authentication → Settings → Authorized domains → add the Vercel domain if it is not already present.

The Google Drive OAuth Client ID is already configured in admin.js.
