import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import QRCode from "qrcode";

interface QRGeneratorProps {
  value: string;
  size?: number;
  studentName?: string;
  onRegenerate?: () => void;
}

export interface QRGeneratorRef {
  downloadQR: () => void;
  regenerateQR: () => void;
}

const QRGenerator = forwardRef<QRGeneratorRef, QRGeneratorProps>(
  ({ value, size = 256, studentName, onRegenerate }, ref) => {
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

    const downloadQR = () => {
      if (!canvasRef.current) return;

      try {
        const link = document.createElement('a');
        link.download = `qr-code-${value}-${studentName || 'student'}.png`;
        link.href = canvasRef.current.toDataURL();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('QR Code download error:', error);
      }
    };

    const regenerateQR = () => {
      generateQR();
      if (onRegenerate) {
        onRegenerate();
      }
    };

    useImperativeHandle(ref, () => ({
      downloadQR,
      regenerateQR
    }));

    return (
      <div className="flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size}
          className="rounded border cursor-pointer hover:shadow-lg transition-shadow"
          onClick={regenerateQR}
          title="انقر لإعادة إنتاج رمز QR"
        />
      </div>
    );
  }
);

QRGenerator.displayName = "QRGenerator";

export default QRGenerator;
