import React from 'react';
import logoImg from '../assets/vyonic_logo_small.webp';

export default function VyonicLogo({ className = '', width = 74, height = 67 }) {
  return (
    <img
      src={logoImg}
      alt="VYONIC"
      width={width}
      height={height}
      className={`vyonic-logo-img ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  );
}
