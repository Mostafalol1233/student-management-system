import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  actor: string;
  details?: any;
  createdAt: string;
}

const ENTITY_LABELS: Record<string, string> = {
  student: "طالب",
  teacher: "مدرس",
  grade: "درجة",
  finance: "مالية",
  expense: "مصروف",
  leave_request: "إجازة",
  attendance: "حضور",
};

function entityLabel(entity: string): string {
  return ENTITY_LABELS[entity] ?? entity;
}

function actionBadge(action: string) {
  const variants: Record<string, { variant: "destructive" | "default" | "secondary" | "outline"; className: string }> = {
    delete:   { variant: "destructive", className: "" },
    create:   { variant: "default",     className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    update:   { variant: "default",     className: "bg-blue-600 hover:bg-blue-700 text-white" },
    approved: { variant: "default",     className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    rejected: { variant: "destructive", className: "" },
  };
  const cfg = variants[action] ?? { variant: "secondary" as const, className: "" };
  return (
    <Badge variant={cfg.variant} className={`text-xs ${cfg.className}`}>
      {action}
    </Badge>
  );
}

export default function AuditLogViewer() {
  const { data: logs = [], isLoading, refetch, isFetching } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/audit-logs");
      if (!r.ok) throw new Error("فشل تحميل سجل التدقيق");
      return r.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm">سجل التدقيق</h3>
          <Badge variant="secondary">{logs.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          تحديث
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText size={28} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">لا توجد سجلات بعد</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">الكيان</TableHead>
                <TableHead className="text-xs">رقم السجل</TableHead>
                <TableHead className="text-xs">الإجراء</TableHead>
                <TableHead className="text-xs">المنفّذ</TableHead>
                <TableHead className="text-xs">الوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/20">
                  <TableCell className="text-sm font-medium">{entityLabel(log.entity)}</TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {log.entityId?.slice(0, 8) ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>{actionBadge(log.action)}</TableCell>
                  <TableCell className="text-sm">{log.actor}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span dir="ltr" className="inline-block">
                      {new Date(log.createdAt).toLocaleDateString("ar-EG")}
                      {" "}
                      {new Date(log.createdAt).toLocaleTimeString("ar-EG")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
