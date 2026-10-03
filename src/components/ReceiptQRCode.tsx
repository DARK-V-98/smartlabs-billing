import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
  className?: string;
}

export const ReceiptQRCode: React.FC<Props> = ({ value, size = 80, className = '' }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(
      value,
      {
        width: size * 2,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      },
      (err, url) => {
        if (!err && isMounted && url) {
          setDataUrl(url);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-400 ${className}`}
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Verification QR Code"
      style={{ width: size, height: size }}
      className={`rounded border border-slate-200/80 bg-white ${className}`}
    />
  );
};
