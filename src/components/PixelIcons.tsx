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

export const PixelConeIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="7" y="2" width="2" height="2" fill="#F97316" />
    <rect x="6" y="4" width="4" height="2" fill="#FB923C" />
    <rect x="5" y="6" width="6" height="2" fill="#F8FAFC" />
    <rect x="4" y="8" width="8" height="3" fill="#F97316" />
    <rect x="2" y="11" width="12" height="2" fill="#EA580C" />
    <rect x="3" y="13" width="10" height="1" fill="#9A3412" />
  </svg>
);

export const PixelCameraIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated shrink-0 ${className}`} aria-hidden="true">
    <rect x="1" y="5" width="9" height="7" fill="#38BDF8" />
    <rect x="2" y="4" width="6" height="1" fill="#94A3B8" />
    <rect x="10" y="6" width="5" height="5" fill="#0284C7" />
    <rect x="3" y="7" width="4" height="3" fill="#0F172A" />
    <rect x="4" y="8" width="2" height="1" fill="#BAE6FD" />
  </svg>
);

export const PixelBrazilMap: React.FC<IconProps> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`pixelated shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect x="5" y="1" width="3" height="2" fill="#1F6D45" />
    <rect x="3" y="3" width="8" height="2" fill="#237A4E" />
    <rect x="2" y="4" width="11" height="3" fill="#298C5A" />
    <rect x="3" y="7" width="11" height="2" fill="#237A4E" />
    <rect x="5" y="9" width="8" height="2" fill="#1F6D45" />
    <rect x="6" y="11" width="5" height="2" fill="#1A5C3A" />
    <rect x="7" y="13" width="3" height="1" fill="#154B30" />
    <rect x="6" y="14" width="2" height="1" fill="#154B30" />
    {/* Subtle emerald highlight pixel */}
    <rect x="8" y="6" width="2" height="2" fill="#4ADE80" opacity="0.65" />
  </svg>
);

export const PixelFlag: React.FC<{ nationality?: string; width?: number; className?: string }> = ({
  nationality = 'Brasil',
  width = 24,
  className = '',
}) => {
  const norm = nationality.toLowerCase();
  const h = Math.round((width * 10) / 14);

  if (norm.includes('argentina')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="14" height="3" fill="#38BDF8" />
        <rect x="0" y="3" width="14" height="4" fill="#F8FAFC" />
        <rect x="0" y="7" width="14" height="3" fill="#38BDF8" />
        <rect x="6" y="4" width="2" height="2" fill="#FACC15" />
      </svg>
    );
  }
  if (norm.includes('uruguai')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="14" height="10" fill="#F8FAFC" />
        <rect x="0" y="2" width="14" height="2" fill="#2563EB" />
        <rect x="0" y="6" width="14" height="2" fill="#2563EB" />
        <rect x="0" y="0" width="5" height="5" fill="#F8FAFC" />
        <rect x="1" y="1" width="3" height="3" fill="#FACC15" />
      </svg>
    );
  }
  if (norm.includes('portugal')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="5" height="10" fill="#16A34A" />
        <rect x="5" y="0" width="9" height="10" fill="#DC2626" />
        <rect x="4" y="4" width="2" height="2" fill="#FACC15" />
      </svg>
    );
  }
  if (norm.includes('itália') || norm.includes('italia')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="4" height="10" fill="#16A34A" />
        <rect x="4" y="0" width="6" height="10" fill="#F8FAFC" />
        <rect x="10" y="0" width="4" height="10" fill="#DC2626" />
      </svg>
    );
  }
  if (norm.includes('espanha')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="14" height="2" fill="#DC2626" />
        <rect x="0" y="2" width="14" height="6" fill="#FACC15" />
        <rect x="0" y="8" width="14" height="2" fill="#DC2626" />
        <rect x="3" y="4" width="2" height="2" fill="#B91C1C" />
      </svg>
    );
  }
  if (norm.includes('japão') || norm.includes('japao')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="14" height="10" fill="#F8FAFC" />
        <rect x="5" y="3" width="4" height="4" fill="#DC2626" />
      </svg>
    );
  }
  if (norm.includes('alemanha')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="14" height="3" fill="#0F172A" />
        <rect x="0" y="3" width="14" height="4" fill="#DC2626" />
        <rect x="0" y="7" width="14" height="3" fill="#FACC15" />
      </svg>
    );
  }
  if (norm.includes('frança') || norm.includes('franca')) {
    return (
      <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
        <rect x="0" y="0" width="4" height="10" fill="#1D4ED8" />
        <rect x="4" y="0" width="6" height="10" fill="#F8FAFC" />
        <rect x="10" y="0" width="4" height="10" fill="#DC2626" />
      </svg>
    );
  }

  // Default: Brasil crisp pixel flag
  return (
    <svg width={width} height={h} viewBox="0 0 14 10" className={`pixelated shrink-0 border border-white/20 ${className}`} aria-hidden="true">
      <rect x="0" y="0" width="14" height="10" fill="#16A34A" />
      <polygon points="7,1 13,5 7,9 1,5" fill="#FACC15" />
      <rect x="5" y="3" width="4" height="4" fill="#1E3A8A" />
      <rect x="5" y="5" width="4" height="1" fill="#F8FAFC" />
    </svg>
  );
};
