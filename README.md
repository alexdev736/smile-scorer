# Smile Scorer

A small web application built with Next.js that lets users register, upload an image, and receive a "smile score" based on their facial expression.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run the development server**:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) with your browser.

4.  **Run Tests**:
    ```bash
    npm run test
    ```

## Architecture

*   **Framework**: Next.js App Router (React 19).
*   **Styling**: Vanilla CSS (`globals.css`) with a focus on modern aesthetics, glassmorphism, and responsive design.
*   **Authentication**: A simple mock authentication service located in `src/lib/auth.ts` to simulate registration and login state.
*   **Smile Scoring**: A mock service layer (`src/lib/scorer.ts`) handles the simulated AI processing. This decouples the scoring logic from the API route, making it easy to swap in a real service later.
*   **API Routes**: A standard Next.js route handler (`src/app/api/upload/route.ts`) processes the `multipart/form-data` upload and communicates with the scoring service.

## Assumptions

*   For the scope of this project, a **mock** authentication and a **mock** smile-scoring engine were used to focus on project structure, component layout, and code organization rather than complex backend or ML integrations.
*   The uploaded images do not need to be permanently persisted to disk or cloud storage for this demo, they are simply processed in memory as Buffers and discarded after scoring.
*   Data persistence is in-memory only (state resets upon server restart).

## Next Steps & What I Would Do Differently With More Time

1.  **Real Face Detection AI**: I would integrate Google Cloud Vision API, AWS Rekognition, or a client-side library like `face-api.js` to perform actual facial analysis to determine a true smile score.
2.  **Robust Authentication & Database**: I would use NextAuth.js combined with Prisma and a PostgreSQL database (or Supabase/Vercel Postgres) for secure user registration, session management, and storing historical scores.
3.  **Cloud Storage**: I would integrate AWS S3, Vercel Blob, or Cloudinary to securely store user-uploaded images and generate shareable links for their "smile scores".
4.  **Enhanced Error Handling & Validation**: Implement Zod for strict request validation (e.g., verifying image sizes, allowed mime types) and show specific toast notifications to users.
5.  **Comprehensive E2E Testing**: Add Playwright or Cypress to write robust end-to-end tests covering the entire user journey from registration to uploading a photo and receiving a result.
