import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle } from "lucide-react";
import type { Student, Session } from "@shared/schema";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: activeSession } = useQuery<Session | null>({
    queryKey: ["/api/sessions/active"],
  });

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
            <Users className="text-primary" size={16} />
            <span className="text-sm font-medium" data-testid="total-students">
              {students?.length || 0} Students
            </span>
          </div>
          {activeSession && (
            <div className="flex items-center space-x-2 bg-secondary/10 px-3 py-2 rounded-lg">
              <CheckCircle className="text-secondary" size={16} />
              <span className="text-sm font-medium" data-testid="active-session">
                Session Active
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
