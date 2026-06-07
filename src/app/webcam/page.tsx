'use client';

import dynamic from 'next/dynamic';

const WebcamDetector = dynamic(() => import('@/components/WebcamDetector'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
        Loading Camera Feed... Please wait.
      </div>
    </div>
  ),
});

export default function WebcamPageWrapper() {
  return <WebcamDetector />;
}
