'use client';

import { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { ScoreRecordSchema } from '@/lib/schema';

type FaceResult = {
  score: number;
  message: string;
  box: { left: string; top: string; width: string; height: string };
};

type QueueItem = {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'done' | 'error' | 'saving' | 'saved';
  results?: FaceResult[];
  error?: string;
  imgWidth?: number;
  imgHeight?: number;
};

export default function UploadFaceDetector() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionModel, setDetectionModel] = useState<'strict' | 'lenient'>('strict');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Load Models on Mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Strict
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Lenient
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading AI models:', err);
        setError('Failed to load AI models. Ensure /models directory exists.');
      }
    };
    loadModels();
  }, []);

  // 2. Queue Engine (Auto-Processor)
  useEffect(() => {
    if (!modelsLoaded) return;

    const processNext = async () => {
      const nextItemIndex = queue.findIndex(q => q.status === 'pending');
      const isProcessing = queue.some(q => q.status === 'processing');
      
      if (nextItemIndex === -1 || isProcessing) return;
      const nextItem = queue[nextItemIndex];

      setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, status: 'processing' } : q));

      try {
        await new Promise(resolve => setTimeout(resolve, 50));

        const img = new Image();
        img.src = nextItem.preview;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        // Save original dimensions in queue immediately so the canvas scales correctly
        setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, imgWidth, imgHeight } : q));

        // Run inference based on selected model
        let detections;
        if (detectionModel === 'lenient') {
          detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        } else {
          detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
        }

        if (!detections || detections.length === 0) {
          setQueue(prev => prev.map(q => q.id === nextItem.id ? { 
            ...q, 
            status: 'error', 
            error: 'No human face detected. Ensure the photo contains a real photograph, not an illustration or cartoon.' 
          } : q));
          return;
        }

        const results: FaceResult[] = detections.map(detection => {
          const landmarks = detection.landmarks.positions;
          const jawWidth = Math.hypot(landmarks[16].x - landmarks[0].x, landmarks[16].y - landmarks[0].y);
          const mouthWidth = Math.hypot(landmarks[54].x - landmarks[48].x, landmarks[54].y - landmarks[48].y);
          
          const ratio = mouthWidth / jawWidth;
          const minRatio = 0.34;
          const maxRatio = 0.48;
          let rawScore = ((ratio - minRatio) / (maxRatio - minRatio)) * 100;
          const score = Math.max(0, Math.min(100, Math.round(rawScore)));

          let message = '';
          if (score >= 90) message = 'Incredible smile!';
          else if (score >= 60) message = 'Genuine smile.';
          else if (score >= 30) message = 'Subtle smirk.';
          else message = 'Very serious.';

          const box = detection.detection.box;
          return {
            score,
            message,
            box: {
              left: `${(box.x / imgWidth) * 100}%`,
              top: `${(box.y / imgHeight) * 100}%`,
              width: `${(box.width / imgWidth) * 100}%`,
              height: `${(box.height / imgHeight) * 100}%`
            }
          };
        });

        // Update state to 'done'
        setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, status: 'done', results } : q));

        // Let React render the DOM, then draw the neon landmarks on the canvas
        setTimeout(() => {
          const canvas = document.getElementById(`canvas-${nextItem.id}`) as HTMLCanvasElement;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw neon pink landmarks
            const drawOptions = {
              drawLines: true,
              color: '#ec4899', // Neon pink to match var(--accent)
              lineWidth: 2
            };
            
            const drawLandmarks = detections.map(d => new faceapi.draw.DrawFaceLandmarks(d.landmarks, drawOptions));
            drawLandmarks.forEach(d => d.draw(canvas));
          }
        }, 100);

      } catch (err: any) {
        setQueue(prev => prev.map(q => q.id === nextItem.id ? { ...q, status: 'error', error: 'Processing error.' } : q));
        console.error(err);
      }
    };

    processNext();
  }, [queue, modelsLoaded, detectionModel]);


  // 3. Input Handlers
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: QueueItem[] = [];
    Array.from(fileList).forEach(file => {
      if (file.type.startsWith('image/')) {
        newItems.push({
          id: Math.random().toString(36).substring(7) + Date.now(),
          file,
          preview: URL.createObjectURL(file),
          status: 'pending'
        });
      }
    });

    if (newItems.length > 0) {
      setQueue(prev => [...prev, ...newItems]);
      setError('');
    } else {
      setError('Please select valid image files.');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!modelsLoaded) return;
    handleFiles(e.dataTransfer.files);
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const clearQueue = () => setQueue([]);

  const handleSaveResult = async (item: QueueItem) => {
    if (!auth.currentUser) {
      alert("You must be logged in to save results.");
      return;
    }
    if (!item.results || item.results.length === 0) return;

    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'saving' } : q));

    try {
      // Create a small base64 thumbnail to store directly in Firestore (bypassing Firebase Storage billing)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = item.preview;
      
      await new Promise((resolve) => { img.onload = resolve; });
      
      const MAX_WIDTH = 300;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const base64Thumbnail = canvas.toDataURL('image/jpeg', 0.7); // compress to 70% quality

      // Validate with Zod
      const record = ScoreRecordSchema.parse({
        userId: auth.currentUser.uid,
        score: item.results[0].score, // Save the primary face score
        message: item.results[0].message,
        imageUrl: base64Thumbnail,
        timestamp: new Date().toISOString()
      });

      // Write directly to Firestore Database
      await addDoc(collection(db, "scores"), record);

      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'saved' } : q));
    } catch (err: any) {
      console.error("Error saving result:", err);
      alert(`Failed to save: ${err.message}`);
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: err.message } : q));
    }
  };

  // 4. Render Grid Item
  const renderQueueItem = (item: QueueItem) => (
    <div key={item.id} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--glass-bg)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
      
      {/* Container matching image aspect ratio perfectly */}
      <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex' }}>
        <img src={item.preview} alt={item.file.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />

        {/* Visual Debugger Canvas for Landmarks (Internal resolution matches image) */}
        {item.imgWidth && item.imgHeight && (
          <canvas 
            id={`canvas-${item.id}`}
            width={item.imgWidth}
            height={item.imgHeight}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        )}

        {/* Overlay Status (Processing & Error) */}
        {(item.status === 'processing' || item.status === 'error') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', borderRadius: '4px' }}>
            {item.status === 'processing' && (
              <svg className="animate-spin" style={{ height: '3rem', width: '3rem', color: 'var(--primary)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}

            {item.status === 'error' && (
              <div style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.9)', padding: '1.5rem', borderRadius: '12px', color: 'white', fontSize: '0.875rem', maxWidth: '90%', lineHeight: '1.4' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1rem' }}>AI Detection Failed</strong>
                {item.error}
              </div>
            )}
          </div>
        )}

        {/* Bounding Boxes & Scores */}
        {item.status === 'done' && item.results && item.results.map((res, idx) => (
          <div key={idx} style={{ 
            position: 'absolute', 
            left: res.box.left, 
            top: res.box.top, 
            width: res.box.width, 
            height: res.box.height, 
            border: '2px solid var(--primary)',
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
            animation: 'fadeIn 0.3s ease-out',
            pointerEvents: 'none'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '-2.5rem', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              background: 'rgba(0,0,0,0.85)', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '8px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(to right, var(--success), var(--primary))', WebkitBackgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>
                {res.score}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.1rem' }}>
                {res.message}
              </span>
            </div>
          </div>
        ))}
        {/* Save Button for Done Status */}
        {item.status === 'done' && item.results && (
          <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleSaveResult(item);
              }}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '9999px',
                background: 'var(--success)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Save to History
            </button>
          </div>
        )}

        {/* Overlay for Saved Status */}
        {item.status === 'saved' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.2)', backdropFilter: 'blur(2px)', borderRadius: '4px', zIndex: 10 }}>
             <div style={{ textAlign: 'center', background: 'var(--success)', padding: '1rem', borderRadius: '12px', color: 'white', fontWeight: 'bold' }}>
                ✓ Saved to History
             </div>
          </div>
        )}

      </div>

      {/* Filename Tag */}
      <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: 'white', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {item.file.name}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, width: '100%' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1000px', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Smile Scorer</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.5rem 0 0 0' }}>Batch Processing Queue</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          
          {/* Model Toggle */}
          <div style={{ background: 'var(--glass-bg)', padding: '0.25rem', borderRadius: '9999px', display: 'flex', border: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => setDetectionModel('strict')}
              style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, border: 'none', background: detectionModel === 'strict' ? 'var(--primary)' : 'transparent', color: detectionModel === 'strict' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Strict Model
            </button>
            <button 
              onClick={() => setDetectionModel('lenient')}
              style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, border: 'none', background: detectionModel === 'lenient' ? 'var(--accent)' : 'transparent', color: detectionModel === 'lenient' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Lenient Mode
            </button>
          </div>

          {queue.length > 0 && (
            <>
              <button onClick={triggerFileInput} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Add Images
              </button>
              <button onClick={clearQueue} className="btn glass-panel" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Clear Queue
              </button>
            </>
          )}
        </div>
      </div>
      
      {!modelsLoaded && !error && (
        <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
          Loading AI Models... Please wait.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '1.5rem', color: 'var(--error)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', width: '100%', maxWidth: '1000px' }}>
          {error}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Dropzone */}
        {queue.length === 0 && (
          <div 
            onClick={modelsLoaded ? triggerFileInput : undefined}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="glass-panel"
            style={{ 
              border: '2px dashed var(--primary)', 
              padding: '6rem 2rem', 
              width: '100%', 
              textAlign: 'center',
              cursor: modelsLoaded ? 'pointer' : 'not-allowed',
              background: 'rgba(139, 92, 246, 0.05)',
              transition: 'all 0.2s ease',
              opacity: modelsLoaded ? 1 : 0.5
            }}
          >
            <p style={{ fontSize: '1.5rem', color: 'white', fontWeight: 600 }}>
              {modelsLoaded ? 'Drag & Drop Images Here' : 'Initializing AI Engine...'}
            </p>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>or click to browse your files</p>
          </div>
        )}

        {/* Grid View */}
        {queue.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {queue.map(renderQueueItem)}
          </div>
        )}

        <input type="file" accept="image/*" multiple style={{ display: 'none' }} ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} />
      </div>
    </div>
  );
}
