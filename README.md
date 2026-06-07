# Smile Scorer

A full-stack web application built with Next.js that lets users register via Firebase, upload an image, and receive a "smile score" based on their facial expression. The application also features a live webcam face detection mode.

## Getting Started

### Option 1: Vercel Cloud (Recommended for Mobile Testing)
This application is designed to be instantly deployable to Vercel. 
1. Go to [Vercel](https://vercel.com) and import this GitHub repository.
2. Under Environment Variables, add your Firebase keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```
3. Click Deploy! You will receive an `https://` URL that is fully compatible with mobile device camera permissions.

### Option 2: Docker
1. Ensure Docker Desktop is installed and running.
2. Create a `.env.local` file in the root directory and add your Firebase configuration (see above).
3. Run the following command to build and start the container:
    ```bash
    docker-compose up -d --build
    ```
4. Open [http://localhost:3000](http://localhost:3000).

### Option 3: Local Node.js
1. `npm install`
2. Add your Firebase keys to `.env.local`.
3. `npm run dev`

## Architecture & Features

*   **Framework**: Next.js App Router.
*   **Authentication**: Live Firebase Authentication integrated for secure user registration, session management, and login state mapping.
*   **Database**: Integrates Firestore to save user scores. Bypasses strict composite indexing by sorting history records client-side.
*   **Image Storage Bypassing**: Uses a clever client-side compression script to convert uploaded images into lightweight Base64 strings, storing them directly in the Firestore database to completely avoid Firebase Storage billing requirements.
*   **Live Webcam Detection**: Integrates `face-api.js` for real-time facial feature tracking directly in the browser.
*   **Strict Typing**: Utilizes **Zod** schema validation to strictly enforce data integrity before any score is committed to the database.
*   **E2E Testing**: Fully configured with Microsoft **Playwright** for automated browser testing (run via `npx playwright test`).
*   **Deployment**: Fully containerized via Docker and `docker-compose` for reproducible production builds, with native Vercel deployment support.

## E2E Testing
To run the automated test suite locally:
```bash
npx playwright install chromium
npx playwright test
```
