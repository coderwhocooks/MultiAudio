import React, { useState, useEffect } from 'react';
import { Zap, Check } from 'lucide-react';

const BOOT_STAGES = [
  'Initializing WASAPI audio endpoints...',
  'Synchronizing low-latency routing bus...',
  'MultiAudio Studio Ready'
];

export default function StartupSplash({ onComplete }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Stage 1 -> Stage 2 transition
    const timer1 = setTimeout(() => {
      setStageIndex(1);
    }, 450);

    // Stage 2 -> Ready transition
    const timer2 = setTimeout(() => {
      setStageIndex(2);
    }, 900);

    // Start fade out
    const timer3 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1250);

    // Complete and unmount from DOM
    const timer4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1600);

    // Allow user to skip by pressing any key
    const handleKeyDown = () => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 200);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 200);
  };

  return (
    <div 
      className={`startup-splash-overlay ${isFadingOut ? 'fading-out' : ''}`}
      onClick={handleSkip}
      title="Click anywhere to skip"
    >
      <div className="startup-splash-backdrop" />

      {/* Center Audiophile Branding Box */}
      <div className="startup-splash-card">
        {/* Subtle expanding acoustic wave rings */}
        <div className="startup-ring startup-ring-1" />
        <div className="startup-ring startup-ring-2" />
        <div className="startup-ring startup-ring-3" />

        {/* Central Logo Box */}
        <div className="startup-logo-box">
          <div className="startup-logo-glow" />
          <div className="startup-logo-inner">
            <Zap size={32} strokeWidth={2.4} className="startup-zap-icon" />
          </div>
        </div>

        {/* Brand Title with Gradient Shimmer */}
        <div className="startup-brand-title">
          <span className="startup-text-gradient">MultiAudio</span>
          <span className="startup-version-pill">v2.4</span>
        </div>

        {/* Animated Frequency Audio Spectrum Bars */}
        <div className="startup-eq-bars" aria-hidden="true">
          <span className="startup-bar bar-1" />
          <span className="startup-bar bar-2" />
          <span className="startup-bar bar-3" />
          <span className="startup-bar bar-4" />
          <span className="startup-bar bar-5" />
          <span className="startup-bar bar-6" />
          <span className="startup-bar bar-7" />
        </div>

        {/* Status Line */}
        <div className="startup-status-box">
          <span className={`startup-status-dot ${stageIndex === 2 ? 'ready' : ''}`} />
          <span className="startup-status-text">
            {stageIndex === 2 ? (
              <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Check size={13} strokeWidth={3} /> {BOOT_STAGES[stageIndex]}
              </span>
            ) : (
              BOOT_STAGES[stageIndex]
            )}
          </span>
        </div>

        {/* Sleek Minimal Hairline Progress */}
        <div className="startup-progress-track">
          <div className={`startup-progress-fill stage-${stageIndex}`} />
        </div>

        {/* Subtle skip hint */}
        <div className="startup-skip-hint">
          Click anywhere or press any key to skip
        </div>
      </div>
    </div>
  );
}
