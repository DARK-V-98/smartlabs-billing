import React from 'react';

interface SmartLabsOfficialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customLogoUrl?: string;
  showSubtitle?: boolean;
}

// Official SmartLabs logo (uploaded artwork, served from /public)
export const SMARTLABS_LOGO_SRC = '/smartlabs-logo.webp';

// Source image is 1254 x 1254 with the logo sitting in a band between y≈478 and y≈736.
// The band is cropped with CSS so only the logo is shown, at any size.
const CROP_TOP_PERCENT = (478 / 1254) * 100;
const CROP_RATIO = '1254 / 258';

export const SmartLabsOfficialLogo: React.FC<SmartLabsOfficialLogoProps> = ({
  className = '',
  size = 'md',
  customLogoUrl,
  showSubtitle = true
}) => {
  const heights = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-14',
    xl: 'h-20'
  };

  const logoSrc = customLogoUrl || SMARTLABS_LOGO_SRC;
  const isCustom = Boolean(customLogoUrl);

  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      {isCustom ? (
        <img src={logoSrc} alt="SmartLabs Official Logo" className={`${heights[size]} object-contain`} />
      ) : (
        <div
          className={`${heights[size]} overflow-hidden`}
          style={{ aspectRatio: CROP_RATIO }}
        >
          <img
            src={logoSrc}
            alt="SmartLabs Official Logo"
            draggable={false}
            className="block w-full h-auto max-w-none"
            style={{ marginTop: `-${CROP_TOP_PERCENT}%` }}
          />
        </div>
      )}

      {showSubtitle && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-extrabold tracking-tight text-slate-800 uppercase">
            SMARTLABS <span className="text-slate-600 font-semibold">(PVT) LTD</span>
          </span>
        </div>
      )}
    </div>
  );
};
