import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }} className="animate-fade-in">
      <h1 style={{ marginBottom: '1.5rem' }}>Discover Your Smile Score</h1>
      <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '600px', marginBottom: '2.5rem', lineHeight: '1.6' }}>
        Upload a picture of yourself and let our AI analyze your expression to determine how happy you look. Join thousands of smiling faces today!
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/upload" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
          Upload Photo Now
        </Link>
        <Link href="/register" className="btn glass-panel" style={{ padding: '1rem 2rem', fontSize: '1.125rem', background: 'rgba(255,255,255,0.1)' }}>
          Create an Account
        </Link>
      </div>

      <div style={{ marginTop: '4rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '300px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>1. Register</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Create a free account to track your smile history and earn badges.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '300px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent)' }}>2. Upload</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Securely upload your photo. We don't store your images after processing.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '300px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--success)' }}>3. Score</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Get an instant smile score from 1 to 100 based on your facial expression.</p>
        </div>
      </div>
    </div>
  );
}
