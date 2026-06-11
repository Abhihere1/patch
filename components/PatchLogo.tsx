'use client';

interface PatchLogoProps {
  size?: number;
  showText?: boolean;
}

export default function PatchLogo({ size = 36, showText = true }: PatchLogoProps) {
  return (
    <div
      data-testid="patch-logo"
      style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
    >
      <div
        style={{
          width: size,
          height: size,
          background: '#DC2626',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm1-9H9v4H7l3 3 3-3h-2V7z"
            fill="white"
          />
        </svg>
      </div>
      {showText && (
        <span style={{ fontWeight: 700, fontSize: size * 0.5, color: '#111827', letterSpacing: '-0.01em' }}>
          Patch
        </span>
      )}
    </div>
  );
}
