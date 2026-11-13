import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const PixelBallIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="4" y="1" width="8" height="14" fill="#F8FAFC" />
    <rect x="2" y="3" width="12" height="10" fill="#F8FAFC" />
    <rect x="1" y="5" width="14" height="6" fill="#F8FAFC" />
    <rect x="6" y="6" width="4" height="4" fill="#0F172A" />
    <rect x="5" y="1" width="6" height="2" fill="#0F172A" />
    <rect x="5" y="13" width="6" height="2" fill="#0F172A" />
    <rect x="1" y="6" width="2" height="4" fill="#0F172A" />
    <rect x="13" y="6" width="2" height="4" fill="#0F172A" />
    <rect x="3" y="3" width="2" height="2" fill="#94A3B8" />
    <rect x="11" y="11" width="2" height="2" fill="#94A3B8" />
  </svg>
);

export const PixelTrophyIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="4" y="2" width="8" height="6" fill="#FACC15" />
    <rect x="5" y="8" width="6" height="2" fill="#EAB308" />
    <rect x="2" y="3" width="2" height="3" fill="#FDE047" />
    <rect x="12" y="3" width="2" height="3" fill="#FDE047" />
    <rect x="7" y="10" width="2" height="2" fill="#CA8A04" />
    <rect x="4" y="12" width="8" height="2" fill="#FACC15" />
    <rect x="3" y="14" width="10" height="1" fill="#A16207" />
    <rect x="5" y="3" width="2" height="3" fill="#FEF08A" />
  </svg>
);

export const PixelCalendarIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="2" y="3" width="12" height="11" fill="#1E293B" />
    <rect x="2" y="3" width="12" height="3" fill="#10B981" />
    <rect x="4" y="1" width="2" height="3" fill="#CBD5E1" />
    <rect x="10" y="1" width="2" height="3" fill="#CBD5E1" />
    <rect x="4" y="8" width="2" height="2" fill="#38BDF8" />
    <rect x="7" y="8" width="2" height="2" fill="#94A3B8" />
    <rect x="10" y="8" width="2" height="2" fill="#94A3B8" />
    <rect x="4" y="11" width="2" height="2" fill="#94A3B8" />
    <rect x="7" y="11" width="2" height="2" fill="#FACC15" />
    <rect x="10" y="11" width="2" height="2" fill="#10B981" />
  </svg>
);

export const PixelWhistleIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="2" y="6" width="8" height="5" fill="#94A3B8" />
    <rect x="8" y="6" width="6" height="3" fill="#CBD5E1" />
    <rect x="3" y="7" width="4" height="3" fill="#475569" />
    <rect x="5" y="3" width="2" height="3" fill="#E2E8F0" />
    <rect x="12" y="7" width="2" height="1" fill="#0F172A" />
  </svg>
);

export const PixelBootIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="2" y="4" width="5" height="7" fill="#10B981" />
    <rect x="2" y="8" width="11" height="4" fill="#10B981" />
    <rect x="11" y="9" width="3" height="3" fill="#059669" />
    <rect x="2" y="12" width="12" height="1" fill="#E2E8F0" />
    <rect x="3" y="13" width="2" height="1" fill="#94A3B8" />
    <rect x="7" y="13" width="2" height="1" fill="#94A3B8" />
    <rect x="11" y="13" width="2" height="1" fill="#94A3B8" />
    <rect x="4" y="6" width="3" height="1" fill="#FACC15" />
  </svg>
);

export const PixelNewspaperIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="2" y="2" width="12" height="12" fill="#E2E8F0" />
    <rect x="3" y="3" width="10" height="2" fill="#0F172A" />
    <rect x="3" y="6" width="4" height="4" fill="#10B981" />
    <rect x="8" y="6" width="5" height="1" fill="#475569" />
    <rect x="8" y="8" width="5" height="1" fill="#475569" />
    <rect x="3" y="11" width="10" height="1" fill="#64748B" />
  </svg>
);

export const PixelTargetIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="3" y="2" width="10" height="12" fill="#E11D48" />
    <rect x="2" y="3" width="12" height="10" fill="#E11D48" />
    <rect x="4" y="4" width="8" height="8" fill="#F8FAFC" />
    <rect x="6" y="6" width="4" height="4" fill="#FACC15" />
    <rect x="7" y="7" width="2" height="2" fill="#0F172A" />
  </svg>
);

export const PixelStadiumIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="1" y="6" width="14" height="7" fill="#334155" />
    <rect x="3" y="4" width="10" height="2" fill="#64748B" />
    <rect x="2" y="2" width="1" height="4" fill="#CBD5E1" />
    <rect x="13" y="2" width="1" height="4" fill="#CBD5E1" />
    <rect x="1" y="1" width="3" height="2" fill="#FEF08A" />
    <rect x="12" y="1" width="3" height="2" fill="#FEF08A" />
    <rect x="3" y="8" width="10" height="4" fill="#10B981" />
    <rect x="7" y="8" width="2" height="4" fill="#E2E8F0" />
  </svg>
);

export const PixelMedalIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="4" y="1" width="3" height="5" fill="#38BDF8" />
    <rect x="9" y="1" width="3" height="5" fill="#0284C7" />
    <rect x="5" y="6" width="6" height="7" fill="#FACC15" />
    <rect x="4" y="7" width="8" height="5" fill="#FACC15" />
    <rect x="6" y="8" width="4" height="3" fill="#FEF08A" />
  </svg>
);

export const PixelShieldIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="3" y="2" width="10" height="7" fill="#38BDF8" />
    <rect x="4" y="9" width="8" height="3" fill="#0284C7" />
    <rect x="6" y="12" width="4" height="2" fill="#0369A1" />
    <rect x="5" y="4" width="6" height="4" fill="#F8FAFC" />
  </svg>
);
