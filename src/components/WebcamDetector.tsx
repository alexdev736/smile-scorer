'use client';

import { useState, useRef, useEffect } from 'react';
import * as faceapi from '@vladmandic/face-api';

type FaceResult = {
  score: number;
  message: string;
  box: { left: string; top: string; width: string; height: string };
};

export default function WebcamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [error, setError] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [results, setResults] = useState<FaceResult[]>([]);
  const [videoDims, setVideoDims] = useState({ width: 640, height: 480 });

  // 1. Load AI Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Use Tiny for 30FPS speed
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

  // 2. Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not access camera. Please grant camera permissions.');
    }
  };

  // 3. Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setResults([]);
    if (canvasRef.current) {
       const ctx = canvasRef.current.getContext('2d');
       if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle video metadata loaded to get actual resolution
  const handlePlay = () => {
    if (videoRef.current) {
      setVideoDims({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });
    }
  };

  // 4. Inference Loop
  useEffect(() => {
    if (!modelsLoaded || !cameraActive || !videoRef.current) return;

    let intervalId: NodeJS.Timeout;

    const runDetection = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        try {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

          const vWidth = videoRef.current.videoWidth || 640;
          const vHeight = videoRef.current.videoHeight || 480;

          if (detections && detections.length > 0) {
            // Calculate Scores & Bounding Boxes
            const mappedResults: FaceResult[] = detections.map(detection => {
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
                  left: `${(box.x / vWidth) * 100}%`,
                  top: `${(box.y / vHeight) * 100}%`,
                  width: `${(box.width / vWidth) * 100}%`,
                  height: `${(box.height / vHeight) * 100}%`
                }
              };
            });
            setResults(mappedResults);

            // Draw Landmarks on Canvas
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              
              const drawOptions = { drawLines: true, color: '#ec4899', lineWidth: 2 };
              const drawLandmarks = detections.map(d => new faceapi.draw.DrawFaceLandmarks(d.landmarks, drawOptions));
              drawLandmarks.forEach(d => d.draw(canvasRef.current!));
            }
          } else {
            setResults([]);
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
        } catch (err) {
           console.error("Inference Error:", err);
        }
      }
    };

    // Cap at ~15 FPS to save battery while remaining smooth
    intervalId = setInterval(runDetection, 66);

    return () => clearInterval(intervalId);
  }, [modelsLoaded, cameraActive]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, width: '100%' }} className="animate-fade-in">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1000px', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Smile Scorer</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.5rem 0 0 0' }}>Live Video Stream</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {cameraActive ? (
            <button onClick={stopCamera} className="btn glass-panel" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', border: '1px solid var(--error)', color: 'var(--error)' }}>
              Stop Camera
            </button>
          ) : (
            <button onClick={startCamera} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} disabled={!modelsLoaded}>
              {modelsLoaded ? 'Start Camera' : 'Loading AI Engine...'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem', color: 'var(--error)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', width: '100%', maxWidth: '1000px' }}>
          {error}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        {/* The Live Video Container */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '16/9', 
          background: 'var(--glass-bg)', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          border: cameraActive ? '2px solid var(--primary)' : '2px dashed var(--glass-border)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: cameraActive ? '0 0 30px rgba(139, 92, 246, 0.2)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          
          {!cameraActive && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
               <svg style={{ width: '4rem', height: '4rem', color: 'rgba(255,255,255,0.2)', margin: '0 auto 1rem auto' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
               </svg>
               <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)' }}>Click "Start Camera" to begin live tracking</p>
            </div>
          )}

          {/* Mirror the video so it acts like a real mirror! */}
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            onPlay={handlePlay}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain', 
              display: cameraActive ? 'block' : 'none',
              transform: 'scaleX(-1)' // Mirror effect
            }} 
          />

          {/* Canvas for Landmarks. Also mirrored so it aligns with mirrored video! */}
          <canvas 
            ref={canvasRef}
            width={videoDims.width}
            height={videoDims.height}
            style={{ 
              position: 'absolute', 
              maxWidth: '100%', 
              maxHeight: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              display: cameraActive ? 'block' : 'none',
              transform: 'scaleX(-1)' // Mirror effect to match video
            }}
          />

          {/* Bounding Boxes & Scores overlay */}
          {/* We wrap these in a mirrored container so the left/top coordinates match the mirrored video perfectly */}
          <div style={{ position: 'absolute', maxWidth: '100%', maxHeight: '100%', width: videoDims.width, height: videoDims.height, transform: 'scaleX(-1)', pointerEvents: 'none', display: cameraActive ? 'block' : 'none', objectFit: 'contain' }}>
            {results.map((res, idx) => (
              <div key={idx} style={{ 
                position: 'absolute', 
                left: res.box.left, 
                top: res.box.top, 
                width: res.box.width, 
                height: res.box.height, 
                border: '2px solid var(--primary)',
                borderRadius: '4px',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
                transition: 'all 0.1s linear' // smooth tracking
              }}>
                {/* Score Badge. We have to un-mirror the text so it's readable! */}
                <div style={{ 
                  position: 'absolute', 
                  top: '-2.5rem', 
                  left: '50%', 
                  transform: 'translateX(-50%) scaleX(-1)', // un-mirror text
                  background: 'rgba(0,0,0,0.85)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.1)'
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
          </div>
        </div>

      </div>
    </div>
  );
}
