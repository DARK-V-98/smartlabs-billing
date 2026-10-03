import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'color' | 'print' | 'white';
}

export const SmartLabsLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'color'
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-13 h-13'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const isPrint = variant === 'print';
  const isWhite = variant === 'white';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* High-fidelity Brand Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl shrink-0 ${
          isPrint
            ? 'bg-slate-900 text-white'
            : isWhite
            ? 'bg-white text-sky-950 shadow-md'
            : 'bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-sky-500/20'
        }`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          {/* Hexagonal Tech Lab Flask & Circuit Node */}
          <path
            d="M17 6H23M20 6V14M13.5 28.5L18.2 16H21.8L26.5 28.5C27.3 30.6 25.7 33 23.5 33H16.5C14.3 33 12.7 30.6 13.5 28.5Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Atomic / Pulse Energy Core */}
          <circle cx="20" cy="25" r="2.5" fill="currentColor" />
          <path
            d="M16 23C17 21.8 23 21.8 24 23"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark & Entity Subtitle */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-extrabold tracking-tight uppercase ${textSizes[size]} ${
              isPrint
                ? 'text-slate-900'
                : isWhite
                ? 'text-white'
                : 'text-slate-900'
            }`}
            style={{ letterSpacing: '-0.02em' }}
          >
            SMART<span className={isPrint ? 'text-sky-800' : 'text-sky-600'}>LABS</span>
          </span>
          <span
            className={`text-[9px] font-bold px-1 py-0.2 rounded border ${
              isPrint
                ? 'text-slate-700 border-slate-400'
                : isWhite
                ? 'text-sky-200 border-sky-400/40 bg-sky-900/50'
                : 'text-sky-700 border-sky-300/60 bg-sky-50'
            }`}
          >
            (PVT) LTD
          </span>
        </div>
        <span
          className={`text-[10px] font-semibold tracking-wider uppercase ${
            isPrint ? 'text-slate-600' : isWhite ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          Center for Technology & Academic Innovation
        </span>
      </div>
    </div>
  );
};
