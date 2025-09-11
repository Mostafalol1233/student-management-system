import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRGeneratorProps {
  value: string;
  size?: number;
}

export default function QRGenerator({ value, size = 256 }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      generateQR();
    }
  }, [value, size]);

  const generateQR = async () => {
    if (!canvasRef.current || !value) return;

    try {
      await QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = '#6b7280';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR Error', size / 2, size / 2);
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size}
        className="rounded border"
      />
    </div>
  );
}
