'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

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
        
        {/* Auth Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: '1rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>{user.displayName || user.email}</span>
              <button onClick={handleLogout} className="btn glass-panel" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ fontWeight: '500', color: 'var(--foreground)' }} className="hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

