'use client';

import dynamic from 'next/dynamic';

const UploadFaceDetector = dynamic(() => import('@/components/UploadFaceDetector'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Get Your Smile Score</h2>
      <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
        Initializing AI Engine... Please wait.
      </div>
    </div>
  ),
});

export default function UploadPage() {
  return <UploadFaceDetector />;
}
