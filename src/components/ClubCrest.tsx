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
      viewBox="0 0 48 48"
      className={className}
      aria-label={`Escudo ${club.name}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M8 6 L40 6 L40 24 C40 34 24 43 24 43 C24 43 8 34 8 24 Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="48" height="48" fill={primary} />
        {club.crestPattern === 'stripes' && (
          <>
            <rect x="14" y="0" width="6" height="48" fill={secondary} />
            <rect x="28" y="0" width="6" height="48" fill={secondary} />
          </>
        )}
        {club.crestPattern === 'halves' && (
          <rect x="24" y="0" width="24" height="48" fill={secondary} />
        )}
        {club.crestPattern === 'hoops' && (
          <>
            <rect x="0" y="12" width="48" height="6" fill={secondary} />
            <rect x="0" y="24" width="48" height="6" fill={secondary} />
          </>
        )}
        {club.crestPattern === 'sash' && (
          <polygon points="4,36 36,4 44,12 12,44" fill={secondary} />
        )}
        {club.crestPattern === 'cross' && (
          <>
            <rect x="20" y="0" width="8" height="48" fill={secondary} />
            <rect x="0" y="18" width="48" height="8" fill={secondary} />
          </>
        )}
      </g>

      <path
        d="M8 6 L40 6 L40 24 C40 34 24 43 24 43 C24 43 8 34 8 24 Z"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="2.5"
      />
      <rect x="12" y="17" width="24" height="11" rx="2" fill="rgba(8,16,24,0.86)" stroke="#CBD5E1" strokeWidth="1" />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="8"
        fontWeight="800"
        fontFamily="Outfit, sans-serif"
        letterSpacing="0.5"
      >
        {club.shortName}
      </text>
    </svg>
  );
};
