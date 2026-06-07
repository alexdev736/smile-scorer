# Smile Scorer: Technical Documentation

This document serves as the primary technical reference for the Smile Scorer application, detailing the frontend/backend architecture, environment configurations, and operating procedures.

---

## 1. Frontend Technical Configuration

The frontend is built using a modern React stack optimized for client-side processing to ensure low latency and high privacy.

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Vanilla CSS (`globals.css`) using CSS variables for a consistent "glassmorphism" design system.
*   **AI Engine**: `face-api.js` (loaded client-side)

### Key Frontend Implementations

#### AI Model Loading (Client-Side)
The AI models (`tinyFaceDetector`, `ssdMobilenetv1`, `faceLandmark68Net`) are loaded asynchronously into the browser memory on component mount.

```typescript
// src/components/UploadFaceDetector.tsx
useEffect(() => {
  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Strict Mode
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Lenient Mode
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  };
  loadModels();
}, []);
```

#### Client-Side Image Compression
To optimize database payloads, images are drawn onto an HTML Canvas and compressed into a Base64 JPEG string before uploading.

```typescript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = previewUrl;

const MAX_WIDTH = 300;
const scaleSize = MAX_WIDTH / img.width;
canvas.width = MAX_WIDTH;
canvas.height = img.height * scaleSize;

ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
const base64Thumbnail = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
```

---

## 2. Backend Technical Configuration

The "Backend" consists of Firebase/Firestore integrated directly via client-side SDKs, secured by strict Zod schema validation and Firebase Security Rules.

*   **Database**: Firebase Firestore (NoSQL)
*   **Authentication**: Firebase Auth (Email/Password & Google OAuth)
*   **Data Validation**: Zod

### Key Backend Implementations

#### Zod Schema Validation
Before writing to the database, data is strictly parsed to prevent malformed injections.

```typescript
// src/lib/schema.ts
import { z } from 'zod';

export const ScoreRecordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  score: z.number().min(0).max(100),
  message: z.string(),
  imageUrl: z.string(), // Accepts Base64 encoded strings
  timestamp: z.string() // ISO 8601 Date string
});
```

#### Firestore Data Write
The validated record is pushed directly to the `scores` collection.

```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const record = ScoreRecordSchema.parse({
  userId: auth.currentUser.uid,
  score: 85,
  message: "Great smile!",
  imageUrl: "data:image/jpeg;base64,...",
  timestamp: new Date().toISOString()
});

await addDoc(collection(db, "scores"), record);
```

---

## 3. General Notes & Architecture Trade-offs

*   **No API Routes for AI**: Instead of sending image payloads to a backend Python server, `face-api.js` processes everything in the browser via WebGL. This drastically reduces server hosting costs and respects user privacy.
*   **Base64 over Cloud Storage**: By keeping images under 1MB via aggressive canvas scaling, we can inject image data directly into the NoSQL JSON document. This circumvents the need to provision or manage a separate Firebase Storage bucket, though it is considered an anti-pattern for large-scale applications.
*   **Mobile Camera Constraints**: Browsers strictly enforce HTTPS for WebRTC camera access. When testing locally on mobile devices over a local IP, the Live Webcam route will be blocked by iOS/Android security policies. Use Vercel deployments to test the camera on mobile.

---

## 4. Manual / Procedure

### Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in the project root containing your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

### Docker Containerization

To run the application in an isolated, production-like environment:

```bash
# Build and start the container in detached mode
docker-compose up -d --build

# Stop the container
docker-compose down
```

### Running E2E Tests (Playwright)

End-to-End tests are configured to verify authentication routing flows.

```bash
# Install Chromium browser binaries (first time only)
npx playwright install chromium

# Run the test suite
npx playwright test

# View the HTML test report
npx playwright show-report
```
