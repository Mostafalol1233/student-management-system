import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Student, Session } from "@shared/schema";

interface HeaderProps {
  title: string;
  description: string;
  titleAr?: string;
}

export default function Header({ title, description, titleAr }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: activeSession } = useQuery<Session | null>({ queryKey: ["/api/sessions/active"] });

  return (
    <header className="border-b bg-card px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{titleAr || title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {activeSession && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot"></span>
            حصة نشطة
          </div>
        )}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          <span data-testid="total-students">{students.length}</span>
          <span>طالب</span>
        </div>
        {searchOpen ? (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              onBlur={() => setSearchOpen(false)}
              placeholder="بحث..."
              className="pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
            />
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors" data-testid="button-search">
            <Search size={17} className="text-muted-foreground" />
          </button>
        )}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative" data-testid="button-notifications">
          <Bell size={17} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center cursor-pointer">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </div>
    </header>
  );
}
