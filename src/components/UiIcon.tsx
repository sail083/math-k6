import type { ReactNode } from 'react';

interface UiIconProps {
  name: 'arrow-left' | 'arrow-right' | 'check' | 'lock' | 'pause' | 'play' | 'progress' | 'spark';
  size?: number;
  className?: string;
}

const paths: Record<UiIconProps['name'], ReactNode> = {
  'arrow-left': <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
  'arrow-right': <><path d="m9 18 6-6-6-6"/><path d="M5 12h10"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  lock: <><rect width="14" height="10" x="5" y="11" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  pause: <><path d="M9 5v14"/><path d="M15 5v14"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  progress: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></>,
  spark: <><path d="m12 3-1.3 4.1a5 5 0 0 1-3.2 3.2L3.5 12l4 1.3a5 5 0 0 1 3.2 3.2l1.3 4 1.3-4a5 5 0 0 1 3.2-3.2l4-1.3-4-1.7a5 5 0 0 1-3.2-3.2Z"/></>,
};

export default function UiIcon({ name, size = 20, className }: UiIconProps) {
  return <svg className={className} aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
