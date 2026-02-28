import React from 'react';

type Props = React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>;

const baseStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  padding: 16,
  border: '1px solid rgba(255,255,255,0.8)',
  boxShadow: '0 8px 24px rgba(30,80,50,0.08)',
};

export default function GlassCard({ children, className, style }: Props) {
  return (
    <div className={className} style={{ ...baseStyle, ...style }}>
      {children}
    </div>
  );
}
