import React from 'react';

interface SmartLabsOfficialLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customLogoUrl?: string;
  showSubtitle?: boolean;
}

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

  // If user configured a custom uploaded logo image
  if (customLogoUrl) {
    return (
      <div className={`flex flex-col items-start ${className}`}>
        <img
          src={customLogoUrl}
          alt="SmartLabs Official Logo"
          className={`${heights[size]} object-contain`}
        />
        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">
              Smartlabs (Pvt) Ltd
            </span>
          </div>
        )}
      </div>
    );
  }

  // Exact vector reproduction of the uploaded SmartLabs official logo
  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      <div className={`${heights[size]} flex items-center`}>
        <svg
          viewBox="0 0 460 115"
          className="h-full w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ========================================================
              TOP WORD: "SMART"
              S, M, R, T in Royal Blue (#0052FF)
              A in Bright Orange (#FF8C00) with central node
          ======================================================== */}
          <g>
            {/* Letter "S" - Modern curved tech letterform */}
            <path
              d="M15 36C15 23 26 14 42 14H82C88 14 92 18 92 24C92 30 88 34 82 34H43C37 34 33 37 33 41C33 45 37 48 43 48H74C87 48 94 56 94 67C94 79 84 88 68 88H25C19 88 15 84 15 78C15 72 19 68 25 68H67C72 68 76 65 76 61C76 57 72 54 67 54H35C22 54 15 47 15 36Z"
              fill="#0052FF"
            />

            {/* Letter "M" */}
            <path
              d="M102 17C102 15 104 14 107 14H119C122 14 125 15 127 18L145 52L163 18C165 15 168 14 171 14H183C186 14 188 15 188 17V85C188 87 186 88 184 88H174C172 88 170 87 170 85V38L151 72C149 75 146 76 143 76H141C138 76 135 75 133 72L116 38V85C116 87 114 88 112 88H104C102 88 102 87 102 85V17Z"
              fill="#0052FF"
            />

            {/* Letter "A" - Stylized Orange Chevron with Central Circle */}
            <g>
              {/* Outer Triangle Outline */}
              <path
                d="M233 13C237 7 245 7 249 13L286 78C290 85 285 92 277 92H205C197 92 192 85 196 78L233 13Z"
                fill="#FF8C00"
              />
              {/* Triangular Inner Cutout */}
              <path
                d="M241 28L268 76H214L241 28Z"
                fill="#FFFFFF"
              />
              {/* Central Orange Core Dot / Node */}
              <circle cx="241" cy="62" r="7.5" fill="#FF8C00" />
            </g>

            {/* Letter "R" */}
            <path
              d="M298 17C298 15 300 14 302 14H334C353 14 366 24 366 41C366 52 359 60 348 64L369 84C371 86 371 88 368 88H356C353 88 351 87 349 85L331 66H315V85C315 87 313 88 311 88H302C300 88 298 87 298 85V17ZM315 29V52H333C344 52 350 47 350 41C350 34 344 29 333 29H315Z"
              fill="#0052FF"
            />

            {/* Letter "T" */}
            <path
              d="M376 18C376 15 379 14 382 14H445C448 14 451 15 451 18C451 21 448 23 445 23H421V85C421 87 419 88 417 88H407C405 88 403 87 403 85V23H382C379 23 376 21 376 18Z"
              fill="#0052FF"
            />
          </g>

          {/* ========================================================
              BOTTOM ROW: BLUE LINE — "L A B S" IN ORANGE — BLUE LINE
          ======================================================== */}
          <g>
            {/* Left Blue Bar */}
            <rect x="14" y="103" width="118" height="4.5" rx="2.25" fill="#0052FF" />

            {/* "L A B S" Text in Orange */}
            <g fill="#FF8C00">
              {/* L */}
              <path d="M149 97H154V112H168V116H149V97Z" />
              {/* A */}
              <path d="M199 97H204L215 116H209L207 112H196L194 116H188L199 97ZM201 102L198 108H205L201 102Z" />
              {/* B */}
              <path d="M242 97H255C260 97 263 99 263 102C263 104 261 106 258 107C262 108 264 111 264 113C264 116 261 116.5 256 116.5H242V97ZM247 101V105H254C256 105 258 104 258 103C258 102 256 101 254 101H247ZM247 108.5V113H255C257 113 259 112 259 110.5C259 109 257 108.5 255 108.5H247Z" />
              {/* S */}
              <path d="M290 102C290 99 293 97 298 97H307C309 97 311 98 311 100C311 102 309 103 307 103H299C296 103 295 104 295 105C295 106 296 107 299 107H306C311 107 314 109 314 112C314 115 311 116.5 306 116.5H297C295 116.5 293 115 293 113C293 111 295 110 297 110H305C308 110 309 109 309 108C309 107 308 106 305 106H298C293 106 290 104 290 102Z" />
            </g>

            {/* Right Blue Bar */}
            <rect x="332" y="103" width="118" height="4.5" rx="2.25" fill="#0052FF" />
          </g>
        </svg>
      </div>

      {showSubtitle && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-extrabold tracking-tight text-slate-800 uppercase">
            SMARTLABS <span className="text-slate-600 font-semibold">(PVT) LTD</span>
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[9.5px] font-medium text-slate-500">
            Center for Technology & Academic Innovation
          </span>
        </div>
      )}
    </div>
  );
};
