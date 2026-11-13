import React from 'react';
import { Club } from '../types/game';

interface ClubCrestProps {
  club: Club;
  size?: number;
  className?: string;
}

export const ClubCrest: React.FC<ClubCrestProps> = ({ club, size = 48, className = '' }) => {
  const { primary, secondary } = club.kit;
  const clipId = `crest-${club.id}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      className={className}
      aria-label={`Escudo ${club.name}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M5 4 H27 V16 L25 20 L22 24 L16 28 L10 24 L7 20 L5 16 Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="32" height="32" fill={primary} />

        {club.crestPattern === 'stripes' && (
          <>
            <rect x="9" y="0" width="4" height="32" fill={secondary} />
            <rect x="19" y="0" width="4" height="32" fill={secondary} />
          </>
        )}

        {club.crestPattern === 'halves' && (
          <rect x="16" y="0" width="16" height="32" fill={secondary} />
        )}

        {club.crestPattern === 'hoops' && (
          <>
            <rect x="0" y="8" width="32" height="4" fill={secondary} />
            <rect x="0" y="16" width="32" height="4" fill={secondary} />
          </>
        )}

        {club.crestPattern === 'sash' && (
          <>
            <rect x="4" y="22" width="6" height="6" fill={secondary} />
            <rect x="8" y="18" width="6" height="6" fill={secondary} />
            <rect x="12" y="14" width="6" height="6" fill={secondary} />
            <rect x="16" y="10" width="6" height="6" fill={secondary} />
            <rect x="20" y="6" width="6" height="6" fill={secondary} />
            <rect x="24" y="2" width="6" height="6" fill={secondary} />
          </>
        )}

        {club.crestPattern === 'cross' && (
          <>
            <rect x="14" y="0" width="4" height="32" fill={secondary} />
            <rect x="0" y="12" width="32" height="4" fill={secondary} />
          </>
        )}

        {club.crestPattern === 'diamond' && (
          <>
            <rect x="14" y="6" width="4" height="18" fill={secondary} />
            <rect x="11" y="9" width="10" height="12" fill={secondary} />
            <rect x="8" y="12" width="16" height="6" fill={secondary} />
          </>
        )}

        {club.crestPattern === 'quartered' && (
          <>
            <rect x="16" y="0" width="16" height="15" fill={secondary} />
            <rect x="0" y="15" width="16" height="17" fill={secondary} />
          </>
        )}

        {club.crestPattern === 'star' && (
          <>
            <rect x="14" y="6" width="4" height="8" fill="#FACC15" />
            <rect x="11" y="9" width="10" height="3" fill="#FACC15" />
            <rect x="12" y="12" width="3" height="3" fill="#FACC15" />
            <rect x="17" y="12" width="3" height="3" fill="#FACC15" />
          </>
        )}
      </g>

      {/* Pixelated heraldic border */}
      <path
        d="M5 4 H27 V16 L25 20 L22 24 L16 28 L10 24 L7 20 L5 16 Z"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="2"
      />

      {/* Pixel badge ribbon with club initials */}
      <rect x="7" y="12" width="18" height="8" fill="#0B121D" />
      <rect x="8" y="13" width="16" height="6" fill="#0F172A" />
      <text
        x="16"
        y="18"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="6.2"
        fontWeight="800"
        fontFamily="JetBrains Mono, monospace"
      >
        {club.shortName}
      </text>
    </svg>
  );
};
