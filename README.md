# Smile Scorer

A full-stack web application built with Next.js that lets users register via Firebase, upload an image, and receive a "smile score" based on their facial expression. The application also features a live webcam face detection mode.

## Getting Started

You can run this project locally using Node.js or spin it up instantly using Docker.

### Option 1: Docker (Recommended)
1. Ensure Docker Desktop is installed and running.
2. Create a `.env.local` file in the root directory and add your Firebase configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```
3. Run the following command to build and start the container:
    ```bash
    docker-compose up -d --build
    ```
4. Open [http://localhost:3000](http://localhost:3000).

### Option 2: Local Node.js
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Add your Firebase keys** to `.env.local` as shown above.
3.  **Run the development server**:
    ```bash
    npm run dev
    ```

## Architecture

*   **Framework**: Next.js App Router (React 19).
*   **Authentication**: Live Firebase Authentication integrated for secure user registration, session management, and login state mapping.
*   **Deployment**: Fully containerized via Docker and `docker-compose` for reproducible production builds.
*   **Live Webcam Detection**: Integrates `face-api.js` for real-time facial feature tracking directly in the browser.
*   **Styling**: Vanilla CSS (`globals.css`) with a focus on modern aesthetics, glassmorphism, and responsive design.
*   **Smile Scoring**: A service layer (`src/lib/scorer.ts`) handles the backend processing logic.
*   **API Routes**: A Next.js route handler processes the `multipart/form-data` uploads and communicates with the scoring service.

## Assumptions & Scope

*   The uploaded batch images do not need to be permanently persisted to cloud storage for this demo; they are processed in memory and discarded.
*   The application prioritizes UX aesthetics and live interactivity (webcam integration).

## Next Steps

1.  **Cloud Storage Integration**: Connect Firebase Storage to securely store user-uploaded images and generate shareable links for their "smile scores" over time.
2.  **Database Integration**: Sync Firebase Auth with Firestore to store historical scoring data for each user.
3.  **Enhanced Error Handling & Validation**: Implement Zod for strict request validation (e.g., verifying image sizes, allowed mime types).
4.  **Comprehensive E2E Testing**: Add Playwright or Cypress to write robust end-to-end tests covering the entire user journey.
