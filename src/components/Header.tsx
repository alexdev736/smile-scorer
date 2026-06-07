import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="glass-panel">
      <Link href="/">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          SmileScorer
        </h2>
      </Link>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link href="/upload" style={{ fontWeight: '500', color: 'var(--foreground)' }} className="hover:text-primary transition-colors">
          Batch Upload
        </Link>
        <Link href="/webcam" style={{ fontWeight: '500', color: 'var(--foreground)' }} className="hover:text-primary transition-colors">
          Live Webcam <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '4px', verticalAlign: 'top', marginLeft: '0.2rem' }}>WIP</span>
        </Link>
      </nav>
    </header>
  );
}
