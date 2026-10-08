import React from 'react';

export type LogoVariant = 'symbol' | 'app-icon' | 'dashboard' | 'favicon' | 'monochrome';
export type GeometricComposition = 'singularity' | 'astrolabe' | 'dual-arc' | 'trefoil';

export interface DataOrbitLogoProps {
  /** Size in pixels (width and height will be identical for square aspect ratio) */
  size?: number | string;
  /** Visual variant of the logo */
  variant?: LogoVariant;
  /** Geometric composition explored (defaults to the selected champion: 'singularity') */
  composition?: GeometricComposition;
  /** Whether to animate the orbital streams gently */
  animated?: boolean;
  /** Custom extra CSS classes */
  className?: string;
  /** Unique ID suffix to prevent SVG gradient ID collisions when multiple logos are rendered */
  idSuffix?: string;
  /** Optional custom title for accessibility */
  title?: string;
}

export const DataOrbitLogo: React.FC<DataOrbitLogoProps> = ({
  size = 40,
  variant = 'symbol',
  composition = 'singularity',
  animated = false,
  className = '',
  idSuffix = 'main',
  title = 'Data Orbit Logo',
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 40;
  const s = typeof size === 'number' ? `${size}px` : size;

  const isMono = variant === 'monochrome';
  const isFavicon = variant === 'favicon' || numericSize <= 32;
  const isAppIcon = variant === 'app-icon';
  const isDashboard = variant === 'dashboard';

  // Gradient IDs
  const gradCyanToBlue = `do-grad-cyan-blue-${idSuffix}`;
  const gradVioletToMagenta = `do-grad-violet-magenta-${idSuffix}`;
  const gradSpectrum = `do-grad-spectrum-${idSuffix}`;
  const gradLimeToTeal = `do-grad-lime-teal-${idSuffix}`;
  const gradCoreGlow = `do-grad-core-glow-${idSuffix}`;
  const gradSquircleBg = `do-grad-squircle-${idSuffix}`;
  const gradGlassRim = `do-grad-rim-${idSuffix}`;
  const glowFilter = `do-glow-filter-${idSuffix}`;

  // Optical compensation factor for micro sizes (16px - 32px)
  const strokeMultiplier = isFavicon ? 1.45 : 1.0;

  return (
    <div
      className={`inline-flex items-center justify-center select-none relative ${className}`}
      style={{ width: s, height: s }}
      role="img"
      aria-label={title}
    >
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <title>{title}</title>
        <defs>
          {/* Subtle multi-color gradients */}
          <linearGradient id={gradCyanToBlue} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="45%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          <linearGradient id={gradVioletToMagenta} x1="85%" y1="15%" x2="15%" y2="85%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          <linearGradient id={gradSpectrum} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="35%" stopColor="#8B5CF6" />
            <stop offset="70%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#A3E635" />
          </linearGradient>

          <linearGradient id={gradLimeToTeal} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="55%" stopColor="#A3E635" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>

          {/* Central Intelligence Node Radial Glow */}
          <radialGradient id={gradCoreGlow} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="30%" stopColor="#00F0FF" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>

          {/* Squircle Background for App Icon */}
          <linearGradient id={gradSquircleBg} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18142E" />
            <stop offset="45%" stopColor="#0E0C1F" />
            <stop offset="100%" stopColor="#070610" />
          </linearGradient>

          {/* Glass Rim Light for App Icon */}
          <linearGradient id={gradGlassRim} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#EC4899" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#A3E635" stopOpacity="0.35" />
          </linearGradient>

          {/* Soft Glow Filter (disabled in micro mode for optimal rendering performance & edge sharpness) */}
          <filter id={glowFilter} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={isFavicon ? '1.2' : '2.4'} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. APP ICON / DASHBOARD BADGE CONTAINER */}
        {(isAppIcon || isDashboard) && (
          <g>
            <rect
              x="6"
              y="6"
              width="108"
              height="108"
              rx={isAppIcon ? '28' : '22'}
              fill="#000000"
              opacity="0.45"
            />
            <rect
              x="6"
              y="6"
              width="108"
              height="108"
              rx={isAppIcon ? '28' : '22'}
              fill={`url(#${gradSquircleBg})`}
            />
            <rect
              x="6.5"
              y="6.5"
              width="107"
              height="107"
              rx={isAppIcon ? '27.5' : '21.5'}
              stroke={`url(#${gradGlassRim})`}
              strokeWidth="1.2"
              fill="none"
            />
            {!isFavicon && (
              <>
                <line x1="28" y1="60" x2="92" y2="60" stroke="#8B5CF6" strokeOpacity="0.12" strokeDasharray="2 3" />
                <line x1="60" y1="28" x2="60" y2="92" stroke="#00F0FF" strokeOpacity="0.12" strokeDasharray="2 3" />
                <circle cx="60" cy="60" r="38" stroke="#EC4899" strokeOpacity="0.08" strokeDasharray="1 4" />
              </>
            )}
          </g>
        )}

        {/* 2. GEOMETRIC COMPOSITION ENGINES */}
        <g
          transform="translate(0, 0)"
          className={animated ? 'animate-[spin_40s_linear_infinite] origin-center' : ''}
        >
          {/* ============================================================ */}
          {/* COMPOSITION 1 (CHAMPION): ORBITAL SINGULARITY (Golden Ratio) */}
          {/* ============================================================ */}
          {composition === 'singularity' && (
            <>
              {/* Subtle Outer Horizon Atmosphere */}
              {!isFavicon && (
                <ellipse
                  cx="60"
                  cy="60"
                  rx="47"
                  ry="47"
                  fill="none"
                  stroke={isMono ? '#94A3B8' : '#8B5CF6'}
                  strokeOpacity={isMono ? '0.15' : '0.14'}
                  strokeWidth="1"
                  strokeDasharray="1.5 6"
                />
              )}

              {/* STREAM 1: Primary Ascending Orbit Stream (Growth Parabola +35deg) */}
              <g transform="rotate(-34 60 60)">
                <ellipse
                  cx="60"
                  cy="60"
                  rx="44"
                  ry="18"
                  fill="none"
                  stroke={isMono ? '#FFFFFF' : `url(#${gradCyanToBlue})`}
                  strokeWidth={(2.8 * strokeMultiplier).toFixed(1)}
                  strokeLinecap="round"
                  strokeDasharray={isFavicon ? 'none' : '118 20 34 16'}
                />
                {/* Apex Discovery Node: Electric Cyan */}
                <circle
                  cx="104"
                  cy="60"
                  r={isFavicon ? 3.8 : 2.7}
                  fill={isMono ? '#FFFFFF' : '#00F0FF'}
                  filter={!isMono && !isFavicon ? `url(#${glowFilter})` : undefined}
                />
                {!isFavicon && (
                  <circle
                    cx="16"
                    cy="60"
                    r={1.8}
                    fill={isMono ? '#94A3B8' : '#3B82F6'}
                    opacity="0.9"
                  />
                )}
              </g>

              {/* STREAM 2: Counter-Cross Orbital Stream (Cognitive Cross -38deg) */}
              <g transform="rotate(38 60 60)">
                <ellipse
                  cx="60"
                  cy="60"
                  rx="43"
                  ry="18.5"
                  fill="none"
                  stroke={isMono ? '#CBD5E1' : `url(#${gradVioletToMagenta})`}
                  strokeWidth={(2.6 * strokeMultiplier).toFixed(1)}
                  strokeLinecap="round"
                  strokeDasharray={isFavicon ? 'none' : '88 22 58 14'}
                />
                {/* Cognitive Node: Vibrant Magenta */}
                <circle
                  cx="103"
                  cy="60"
                  r={isFavicon ? 3.6 : 2.5}
                  fill={isMono ? '#FFFFFF' : '#EC4899'}
                />
                {!isFavicon && (
                  <circle
                    cx="24"
                    cy="56"
                    r={1.7}
                    fill={isMono ? '#94A3B8' : '#A855F7'}
                    opacity="0.85"
                  />
                )}
              </g>

              {/* STREAM 3: Equatorial Horizon Ring (Systemic Data Ring -84deg) */}
              <g transform="rotate(-84 60 60)">
                <ellipse
                  cx="60"
                  cy="60"
                  rx="41.5"
                  ry="16.5"
                  fill="none"
                  stroke={isMono ? '#94A3B8' : `url(#${gradLimeToTeal})`}
                  strokeWidth={(2.2 * strokeMultiplier).toFixed(1)}
                  strokeLinecap="round"
                  strokeDasharray={isFavicon ? 'none' : '65 22 80 18'}
                  opacity={isMono ? '0.6' : '0.85'}
                />
                {/* Anomaly Discovery Node: Vibrant Discovery Lime Accent */}
                <circle
                  cx="101.5"
                  cy="60"
                  r={isFavicon ? 3.4 : 2.4}
                  fill={isMono ? '#FFFFFF' : '#A3E635'}
                  filter={!isMono && !isFavicon ? `url(#${glowFilter})` : undefined}
                />
              </g>

              {/* Polar Chart Coordinate Geometry (Hidden on tiny favicon for optimal scalability) */}
              {!isFavicon && (
                <path
                  d="M 33 60 A 27 27 0 0 1 87 60"
                  fill="none"
                  stroke={isMono ? '#64748B' : '#00F0FF'}
                  strokeWidth="1.2"
                  strokeDasharray="2 3"
                  strokeOpacity={isMono ? '0.4' : '0.55'}
                />
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* COMPOSITION 2: CELESTIAL ASTROLABE (Coordinate Geometry)     */}
          {/* ============================================================ */}
          {composition === 'astrolabe' && (
            <>
              {/* Outer calibrated boundary circle with tick marks */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke={isMono ? '#94A3B8' : `url(#${gradCyanToBlue})`}
                strokeWidth={isFavicon ? '3.4' : '2.0'}
              />
              {!isFavicon && (
                <>
                  <circle cx="60" cy="60" r="34" fill="none" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <circle cx="60" cy="60" r="23" fill="none" stroke="#00F0FF" strokeWidth="1" strokeDasharray="1 3" opacity="0.5" />
                  {/* Coordinate crosshairs */}
                  <line x1="15" y1="60" x2="105" y2="60" stroke="#EC4899" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4 4" />
                  <line x1="60" y1="15" x2="60" y2="105" stroke="#00F0FF" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4 4" />
                </>
              )}
              {/* Orbital Elliptical Sling */}
              <g transform="rotate(-40 60 60)">
                <ellipse
                  cx="60"
                  cy="60"
                  rx="45"
                  ry="21"
                  fill="none"
                  stroke={isMono ? '#FFFFFF' : `url(#${gradVioletToMagenta})`}
                  strokeWidth={(2.4 * strokeMultiplier).toFixed(1)}
                />
                <circle cx="105" cy="60" r={isFavicon ? 3.6 : 2.8} fill="#EC4899" />
              </g>
              <g transform="rotate(50 60 60)">
                <ellipse
                  cx="60"
                  cy="60"
                  rx="45"
                  ry="21"
                  fill="none"
                  stroke={isMono ? '#A3E635' : `url(#${gradLimeToTeal})`}
                  strokeWidth={(2.2 * strokeMultiplier).toFixed(1)}
                />
                <circle cx="105" cy="60" r={isFavicon ? 3.4 : 2.6} fill="#A3E635" />
              </g>
            </>
          )}

          {/* ============================================================ */}
          {/* COMPOSITION 3: DYNAMIC DUAL-CRESCENT (Minimal High Impact)  */}
          {/* ============================================================ */}
          {composition === 'dual-arc' && (
            <>
              {/* Upper Leading Arc Sweep */}
              <path
                d="M 20 54 C 22 28, 62 16, 94 34 C 102 38, 104 46, 96 46 C 72 34, 42 42, 34 62 C 32 68, 22 68, 20 54 Z"
                fill={isMono ? '#FFFFFF' : `url(#${gradCyanToBlue})`}
              />
              {/* Lower Counter Arc Sweep */}
              <path
                d="M 100 66 C 98 92, 58 104, 26 86 C 18 82, 16 74, 24 74 C 48 86, 78 78, 86 58 C 88 52, 98 52, 100 66 Z"
                fill={isMono ? '#CBD5E1' : `url(#${gradVioletToMagenta})`}
              />
              {/* Tangent Discovery Nodes */}
              <circle cx="98" cy="38" r={isFavicon ? 4.2 : 3.0} fill="#00F0FF" />
              <circle cx="22" cy="82" r={isFavicon ? 4.0 : 2.8} fill="#EC4899" />
              <circle cx="60" cy="18" r={isFavicon ? 3.4 : 2.2} fill="#A3E635" />
            </>
          )}

          {/* ============================================================ */}
          {/* COMPOSITION 4: TREFOIL CONTINUUM (Topological Ribbon)       */}
          {/* ============================================================ */}
          {composition === 'trefoil' && (
            <>
              {/* 3 Interlocking Lobe Loops at 120deg */}
              {[0, 120, 240].map((deg, i) => (
                <g key={deg} transform={`rotate(${deg} 60 60)`}>
                  <path
                    d="M 60 60 C 45 40, 36 20, 60 16 C 84 20, 75 40, 60 60"
                    fill="none"
                    stroke={
                      isMono
                        ? '#FFFFFF'
                        : i === 0
                        ? `url(#${gradCyanToBlue})`
                        : i === 1
                        ? `url(#${gradVioletToMagenta})`
                        : `url(#${gradLimeToTeal})`
                    }
                    strokeWidth={(2.8 * strokeMultiplier).toFixed(1)}
                    strokeLinecap="round"
                  />
                  <circle
                    cx="60"
                    cy="16"
                    r={isFavicon ? 3.4 : 2.4}
                    fill={i === 0 ? '#00F0FF' : i === 1 ? '#EC4899' : '#A3E635'}
                  />
                </g>
              ))}
            </>
          )}

          {/* ============================================================ */}
          {/* 3. CENTRAL INTELLIGENCE SINGULARITY (Unified Visual Anchor)  */}
          {/* ============================================================ */}
          {/* Ambient outer core glow aura */}
          <circle
            cx="60"
            cy="60"
            r={isFavicon ? 12 : 13.5}
            fill={isMono ? '#FFFFFF' : `url(#${gradCoreGlow})`}
            opacity={isMono ? '0.15' : '0.65'}
          />

          {/* Mid core energy boundary ring */}
          <circle
            cx="60"
            cy="60"
            r={isFavicon ? 8.0 : 8.8}
            fill={isMono ? '#1E293B' : '#0B0A1A'}
            stroke={isMono ? '#FFFFFF' : `url(#${gradSpectrum})`}
            strokeWidth={isFavicon ? 2.6 : 1.8}
          />

          {/* Inner luminous singularity core */}
          <circle
            cx="60"
            cy="60"
            r={isFavicon ? 4.2 : 4.4}
            fill="#FFFFFF"
            filter={!isMono && !isFavicon ? `url(#${glowFilter})` : undefined}
          />

          {/* Center Spark: High-Precision Cyan Node */}
          <circle
            cx="60"
            cy="60"
            r={1.6}
            fill={isMono ? '#0F172A' : '#00F0FF'}
          />
        </g>
      </svg>
    </div>
  );
};
