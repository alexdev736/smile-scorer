'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ScoreRecord } from '@/lib/schema';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const q = query(
          collection(db, "scores"), 
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const history: ScoreRecord[] = [];
        querySnapshot.forEach((doc) => {
          history.push(doc.data() as ScoreRecord);
        });
        // Sort in memory to bypass the Firebase Composite Index requirement
        history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setScores(history);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Loading History...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>My Score History</h1>
      
      {scores.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p>You haven't saved any scores yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {scores.map((score, idx) => (
            <div key={idx} className="glass-panel animate-fade-in" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', overflow: 'hidden', borderRadius: '8px', marginBottom: '1rem' }}>
                <img src={score.imageUrl} alt="Saved score" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{score.score}</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{new Date(score.timestamp).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>{score.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
