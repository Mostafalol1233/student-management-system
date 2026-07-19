import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { Finance, Student } from "@shared/schema";

interface PaymentReceiptProps {
  finance: Finance;
  student: Student;
  centerName: string;
  onClose: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقداً",
  transfer: "تحويل بنكي",
  vodafone_cash: "فودافون كاش",
  instapay: "انستاباي",
  other: "أخرى",
};

export default function PaymentReceipt({ finance, student, centerName, onClose }: PaymentReceiptProps) {
  const receiptNumber = finance.receiptNumber || finance.id.slice(-6).toUpperCase();
  const paidDate = finance.paidDate || new Date().toISOString().split("T")[0];
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[finance.paymentMethod || "cash"] || finance.paymentMethod || "نقداً";

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="p-6 space-y-6 font-sans" dir="rtl">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-xl font-bold">{centerName}</h1>
          <h2 className="text-lg font-semibold mt-1">وصل استلام مبلغ</h2>
        </div>

        {/* Receipt meta */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">رقم الإيصال:</span>
            <span className="font-bold mr-2 font-mono">{receiptNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground">تاريخ الدفع:</span>
            <span className="font-medium mr-2">{paidDate}</span>
          </div>
        </div>

        {/* Student info */}
        <div className="border rounded-md p-4 space-y-2 text-sm bg-muted/30">
          <div className="font-semibold text-base mb-2">بيانات الطالب</div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الاسم:</span>
            <span className="font-medium">{student.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الكود:</span>
            <span className="font-mono">{student.code}</span>
          </div>
        </div>

        {/* Payment details */}
        <div className="border rounded-md p-4 space-y-2 text-sm">
          <div className="font-semibold text-base mb-2">تفاصيل الدفعة</div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">نوع الرسوم:</span>
            <span className="font-medium">{finance.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المبلغ الكلي:</span>
            <span className="font-mono font-medium">{finance.amount.toLocaleString()} جنيه</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-muted-foreground font-semibold">المبلغ المدفوع:</span>
            <span className="font-bold text-emerald-700 text-base font-mono">
              {(finance.paid ?? 0).toLocaleString()} جنيه
            </span>
          </div>
          {finance.amount - (finance.paid ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">المتبقي:</span>
              <span className="font-mono text-red-600">{(finance.amount - (finance.paid ?? 0)).toLocaleString()} جنيه</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">طريقة الدفع:</span>
            <span className="font-medium">{paymentMethodLabel}</span>
          </div>
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-2 gap-8 pt-4 mt-4">
          <div className="text-center space-y-8">
            <div className="text-sm font-semibold">المستلم</div>
            <div className="border-b border-dashed border-gray-400 pt-10" />
            <div className="text-xs text-muted-foreground">التوقيع</div>
          </div>
          <div className="text-center space-y-8">
            <div className="text-sm font-semibold">المراجع</div>
            <div className="border-b border-dashed border-gray-400 pt-10" />
            <div className="text-xs text-muted-foreground">التوقيع</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2 no-print">
          <Button className="flex-1" onClick={() => window.print()}>
            <Printer size={14} className="mr-2" />
            طباعة
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X size={14} className="mr-2" />
            إغلاق
          </Button>
        </div>
      </div>
    </>
  );
}
