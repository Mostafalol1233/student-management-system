export const generateQRValue = (studentCode: string): string => {
  // Generate a QR value that includes the student code and a timestamp for security
  const timestamp = Date.now();
  return `${studentCode}-${timestamp}`;
};

export const parseQRValue = (qrValue: string): { code: string; timestamp: number } | null => {
  try {
    const parts = qrValue.split('-');
    if (parts.length >= 2) {
      const code = parts[0];
      const timestamp = parseInt(parts[parts.length - 1]);
      return { code, timestamp };
    }
    return null;
  } catch {
    return null;
  }
};

export const isValidQRCode = (qrValue: string, maxAgeMinutes: number = 60): boolean => {
  const parsed = parseQRValue(qrValue);
  if (!parsed) return false;
  
  const ageMinutes = (Date.now() - parsed.timestamp) / (1000 * 60);
  return ageMinutes <= maxAgeMinutes;
};
