import React, { useEffect, useState, useRef } from 'react';
import { 
  Trash2, 
  RefreshCw, 
  Share2, 
  X,
  Split,
} from 'lucide-react';

export default function RoutingCanvas({
  connections,
  apps,
  devices,
  isAudioLive,
  dragState,
  onDisconnectRoute,
  onClearAllRoutes,
  onResetDefaultRoutes,
  onScanHardware,
  isScanning = false,
  onOpenDualTransfer,
}) {
  const svgRef = useRef(null);
  const [cableCoords, setCableCoords] = useState([]);
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const prevCoordsRef = useRef([]);

  // Recalculate connector jack positions relative to the SVG canvas
  const updateCoords = () => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();

    const coords = connections.map(conn => {
      const sourceEl = document.getElementById(`port-source-${conn.sourceId}`);
      const targetEl = document.getElementById(`port-target-${conn.targetId}`);

      if (!sourceEl || !targetEl) return null;

      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // Exactly the center of the source port jack, relative to the SVG canvas:
      const x1 = (sourceRect.left + sourceRect.width / 2) - svgRect.left;
      const y1 = (sourceRect.top + sourceRect.height / 2) - svgRect.top;

      // Exactly the center of the target port jack, relative to the SVG canvas:
      const x2 = (targetRect.left + targetRect.width / 2) - svgRect.left;
      const y2 = (targetRect.top + targetRect.height / 2) - svgRect.top;

      const app = apps.find(a => a.id === conn.sourceId);
      const dev = devices.find(d => d.id === conn.targetId);

      return {
        ...conn,
        x1,
        y1,
        x2,
        y2,
        appName: app?.name || 'App',
        devName: dev?.name || 'Device',
        color: conn.color || app?.color || '#6366f1'
      };
    }).filter(Boolean);

    // Only trigger React state update if coordinates moved by at least 0.5px
    const prev = prevCoordsRef.current;
    const hasChanged = coords.length !== prev.length || coords.some((c, i) => {
      const p = prev[i];
      return !p || Math.abs(c.x1 - p.x1) > 0.5 || Math.abs(c.y1 - p.y1) > 0.5 ||
                   Math.abs(c.x2 - p.x2) > 0.5 || Math.abs(c.y2 - p.y2) > 0.5;
    });

    if (hasChanged) {
      prevCoordsRef.current = coords;
      setCableCoords(coords);
    }
  };

  useEffect(() => {
    updateCoords();

    // Listen to resize and scroll on all containers (capture phase)
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    // Continuous RAF loop to guarantee fluid sync during scrolling and animations
    let animId;
    const loop = () => {
      updateCoords();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
      cancelAnimationFrame(animId);
    };
  }, [connections, apps, devices]);

  // Generate smooth cubic bezier curve
  const createPath = (x1, y1, x2, y2) => {
    const deltaX = Math.abs(x2 - x1);
    const curvature = Math.max(deltaX * 0.45, 60);
    return `M ${x1} ${y1} C ${x1 + curvature} ${y1}, ${x2 - curvature} ${y2}, ${x2} ${y2}`;
  };

  // Dragging active cable
  let dragPath = null;
  let dragX = 0;
  let dragY = 0;

  if (dragState.isDragging && svgRef.current) {
    const svgRect = svgRef.current.getBoundingClientRect();
    const sourceEl = document.getElementById(`port-source-${dragState.sourceId}`);
    if (sourceEl) {
      const sourceRect = sourceEl.getBoundingClientRect();
      const x1 = (sourceRect.left + sourceRect.width / 2) - svgRect.left;
      const y1 = (sourceRect.top + sourceRect.height / 2) - svgRect.top;
      dragX = dragState.currentX - svgRect.left;
      dragY = dragState.currentY - svgRect.top;
      dragPath = createPath(x1, y1, dragX, dragY);
    }
  }

  // Find sources with dual connections (1-to-2 routes)
  const sourceRouteCounts = {};
  connections.forEach(c => {
    sourceRouteCounts[c.sourceId] = (sourceRouteCounts[c.sourceId] || 0) + 1;
  });

  return (
    <>
      {/* SVG Canvas Overlay spanning entire workspace */}
      <svg className="workspace-patch-svg" ref={svgRef}>
        <defs>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Established Route Patch Cables */}
        {cableCoords.map((c) => {
          const pathD = createPath(c.x1, c.y1, c.x2, c.y2);
          const isHovered = hoveredRoute === c.id;
          const isDual = (sourceRouteCounts[c.sourceId] || 0) >= 2;

          return (
            <g key={c.id}>
              {/* Outer Glow Path */}
              <path
                d={pathD}
                stroke={isDual ? 'var(--accent-cyan)' : c.color}
                strokeWidth={isHovered ? 8 : (isDual ? 5 : 4)}
                strokeOpacity={isHovered ? 0.95 : (isDual ? 0.85 : 0.75)}
                fill="none"
                filter="url(#glow-filter)"
                className="patch-cable-path"
                onMouseEnter={() => setHoveredRoute(c.id)}
                onMouseLeave={() => setHoveredRoute(null)}
                onClick={() => onDisconnectRoute(c.id)}
              />

              {/* Inner Bright Core Path */}
              <path
                d={pathD}
                stroke="#ffffff"
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeOpacity={0.85}
                fill="none"
                style={{ pointerEvents: 'none' }}
              />

              {/* Traveling Audio Stream Energy Pulses */}
              {isAudioLive && (
                <circle r={isDual ? "4.5" : "4"} fill={isDual ? "var(--accent-cyan)" : "#ffffff"} className="cable-particle">
                  <animateMotion
                    path={pathD}
                    dur={`${1.8 + (Math.sin(c.id.charCodeAt(5) || 1) * 0.6)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Actively Dragged Cable */}
        {dragPath && (
          <g style={{ pointerEvents: 'none' }}>
            <path
              d={dragPath}
              stroke="var(--accent-cyan)"
              strokeWidth="5"
              fill="none"
              strokeDasharray="6 4"
              filter="url(#glow-filter)"
              style={{ pointerEvents: 'none' }}
            />
            <circle
              cx={dragX}
              cy={dragY}
              r="7"
              fill="var(--accent-cyan)"
              filter="url(#glow-filter)"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        )}
      </svg>

      {/* Central spacer column with bottom floating bar */}
      <div className="patch-canvas-area">
        <div className="cable-interactive-overlay">
          {hoveredRoute ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {(() => {
                const r = cableCoords.find(c => c.id === hoveredRoute);
                if (!r) return null;
                const isDual = (sourceRouteCounts[r.sourceId] || 0) >= 2;
                return (
                  <>
                    <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{r.appName} ➔ {r.devName}</span>
                      {isDual && (
                        <span style={{ fontSize: '0.62rem', background: 'rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                          1 ➔ 2 DUAL ACTIVE
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => onDisconnectRoute(r.id)}
                      style={{
                        background: 'rgba(244, 63, 94, 0.2)',
                        border: '1px solid var(--accent-rose)',
                        color: 'var(--accent-rose)',
                        borderRadius: 'var(--radius-full)',
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <X size={12} /> Disconnect
                    </button>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="cable-hint">
              <Share2 size={14} color="var(--accent-indigo)" />
              <span>Drag cable to an output device • Connect 2 devices to split 1 source to 2 outputs</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
            {/* Quick 1-to-2 Splitter button */}
            {onOpenDualTransfer && (
              <button
                onClick={() => onOpenDualTransfer()}
                className="nudge-btn"
                title="Transfer 1 input source to 2 output sources with latency sync"
                style={{ 
                  color: 'var(--accent-cyan)', 
                  borderColor: 'rgba(6, 182, 212, 0.45)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4,
                  background: 'rgba(6, 182, 212, 0.08)'
                }}
              >
                <Share2 size={11} /> 
                <span>1 ➔ 2 Splitter</span>
              </button>
            )}

            {onScanHardware && (
              <button
                onClick={onScanHardware}
                disabled={isScanning}
                className="nudge-btn"
                title="Search & refresh connected audio apps and sound devices"
              >
                <RefreshCw size={11} className={isScanning ? 'spin-icon' : ''} style={{ marginRight: 3 }} /> 
                {isScanning ? 'Scanning...' : 'Rescan'}
              </button>
            )}
            <button
              onClick={onResetDefaultRoutes}
              className="nudge-btn"
              title="Reset to default multi-stream routes"
            >
              <RefreshCw size={11} style={{ marginRight: 3 }} /> Reset
            </button>
            <button
              onClick={onClearAllRoutes}
              className="nudge-btn"
              title="Unplug all patch cables"
            >
              <Trash2 size={11} style={{ marginRight: 3 }} /> Clear All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
