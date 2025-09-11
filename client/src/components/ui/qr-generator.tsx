import { useEffect, useRef } from "react";

interface QRGeneratorProps {
  value: string;
  size?: number;
}

declare global {
  interface Window {
    QRCode: any;
  }
}

export default function QRGenerator({ value, size = 256 }: QRGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.QRCode) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.onload = () => generateQR();
      document.head.appendChild(script);
    } else {
      generateQR();
    }
  }, [value, size]);

  const generateQR = () => {
    if (qrRef.current && window.QRCode && value) {
      qrRef.current.innerHTML = '';
      window.QRCode.toCanvas(qrRef.current, value, {
        width: size,
        height: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error: any) => {
        if (error) {
          console.error('QR Code generation error:', error);
          qrRef.current!.innerHTML = '<div class="text-center text-muted-foreground">QR Code Error</div>';
        }
      });
    }
  };

  return <div ref={qrRef} className="flex items-center justify-center" />;
}
